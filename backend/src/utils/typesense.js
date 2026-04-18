/**
 * Typesense client utility
 * ========================
 * Graceful degradation: if Typesense is unavailable, search falls back to MongoDB.
 *
 * Environment variables:
 *   TYPESENSE_HOST      - default: localhost (docker service name: typesense)
 *   TYPESENSE_PORT      - default: 8108
 *   TYPESENSE_PROTOCOL  - default: http
 *   TYPESENSE_API_KEY   - default: petverse-dev-key  (CHANGE IN PRODUCTION)
 */

const Typesense = require('typesense');

let client = null;
let isConnected = false;

function getClient() {
    if (client) return client;

    client = new Typesense.Client({
        nodes: [{
            host:     process.env.TYPESENSE_HOST     || 'localhost',
            port:     parseInt(process.env.TYPESENSE_PORT || '8108'),
            protocol: process.env.TYPESENSE_PROTOCOL  || 'http'
        }],
        apiKey:                   process.env.TYPESENSE_API_KEY || 'petverse-dev-key',
        connectionTimeoutSeconds: 3,
        retryIntervalSeconds:     0.1,
        numRetries:               1
    });

    return client;
}

// ── Collection schemas ────────────────────────────────────────────────────────

const SCHEMAS = {
    pets: {
        name: 'pets',
        fields: [
            { name: 'id',          type: 'string' },
            { name: 'name',        type: 'string' },
            { name: 'breed',       type: 'string' },
            { name: 'category',    type: 'string', facet: true },
            { name: 'price',       type: 'float'  },
            { name: 'age',         type: 'string', optional: true },
            { name: 'gender',      type: 'string', facet: true },
            { name: 'description', type: 'string', optional: true },
            { name: 'available',   type: 'bool'   },
            { name: 'thumbnail',   type: 'string', optional: true },
            { name: 'createdAt',   type: 'int64'  }
        ],
        default_sorting_field: 'createdAt'
    },
    products: {
        name: 'products',
        fields: [
            { name: 'id',          type: 'string' },
            { name: 'name',        type: 'string' },
            { name: 'brand',       type: 'string', optional: true },
            { name: 'category',    type: 'string', facet: true },
            { name: 'price',       type: 'float'  },
            { name: 'discount',    type: 'float'  },
            { name: 'stock',       type: 'int32'  },
            { name: 'description', type: 'string', optional: true },
            { name: 'avgRating',   type: 'float',  optional: true },
            { name: 'thumbnail',   type: 'string', optional: true },
            { name: 'isActive',    type: 'bool'   },
            { name: 'createdAt',   type: 'int64'  }
        ],
        default_sorting_field: 'createdAt'
    },
    services: {
        name: 'services',
        fields: [
            { name: 'id',                 type: 'string' },
            { name: 'name',               type: 'string' },
            { name: 'serviceType',        type: 'string', facet: true },
            { name: 'serviceAddress',     type: 'string', optional: true },
            { name: 'serviceDescription', type: 'string', optional: true },
            { name: 'experienceYears',    type: 'int32',  optional: true },
            { name: 'createdAt',          type: 'int64'  }
        ],
        default_sorting_field: 'createdAt'
    },
    events: {
        name: 'events',
        fields: [
            { name: 'id',             type: 'string' },
            { name: 'title',          type: 'string' },
            { name: 'description',    type: 'string', optional: true },
            { name: 'category',       type: 'string', facet: true },
            { name: 'eventDate',      type: 'int64'  },
            { name: 'city',           type: 'string', facet: true, optional: true },
            { name: 'entryFee',       type: 'float'  },
            { name: 'status',         type: 'string', facet: true },
            { name: 'availableSlots', type: 'int32'  },
            { name: 'thumbnail',      type: 'string', optional: true },
            { name: 'tags',           type: 'string[]', optional: true }
        ],
        default_sorting_field: 'eventDate'
    },
    mates: {
        name: 'mates',
        fields: [
            { name: 'id',          type: 'string' },
            { name: 'name',        type: 'string' },
            { name: 'breed',       type: 'string' },
            { name: 'petType',     type: 'string', facet: true },
            { name: 'gender',      type: 'string', facet: true },
            { name: 'state',       type: 'string', optional: true },
            { name: 'district',    type: 'string', optional: true },
            { name: 'description', type: 'string', optional: true },
            { name: 'thumbnail',   type: 'string', optional: true },
            { name: 'createdAt',   type: 'int64'  }
        ],
        default_sorting_field: 'createdAt'
    }
};

// ── Init / collection setup ───────────────────────────────────────────────────

async function ensureCollections() {
    const c = getClient();
    for (const schema of Object.values(SCHEMAS)) {
        try {
            await c.collections(schema.name).retrieve();
        } catch (err) {
            if (err.httpStatus === 404) {
                await c.collections().create(schema);
                console.log(`[Typesense] Created collection: ${schema.name}`);
            } else {
                throw err;
            }
        }
    }
}

async function initTypesense() {
    try {
        await ensureCollections();
        isConnected = true;
        console.log('[Typesense] Connected — all collections ready');
    } catch (err) {
        isConnected = false;
        console.warn('[Typesense] Not available — search will fall back to MongoDB:', err.message);
    }
}

// ── Document mappers ──────────────────────────────────────────────────────────

function petToDoc(p) {
    return {
        id:          p._id.toString(),
        name:        p.name        || '',
        breed:       p.breed       || '',
        category:    p.category    || '',
        price:       parseFloat(p.price)   || 0,
        age:         p.age ? String(p.age)  : '',
        gender:      p.gender      || '',
        description: p.description || '',
        available:   Boolean(p.available),
        thumbnail:   p.images?.[0]?.url    || '',
        createdAt:   p.createdAt ? new Date(p.createdAt).getTime() : Date.now()
    };
}

function productToDoc(p) {
    return {
        id:          p._id.toString(),
        name:        p.name        || '',
        brand:       p.brand       || '',
        category:    p.category    || '',
        price:       parseFloat(p.price)    || 0,
        discount:    parseFloat(p.discount) || 0,
        stock:       parseInt(p.stock)      || 0,
        description: p.description          || '',
        avgRating:   parseFloat(p.avgRating) || 0,
        thumbnail:   p.images?.[0]?.url     || '',
        isActive:    p.isActive !== false,
        createdAt:   p.createdAt ? new Date(p.createdAt).getTime() : Date.now()
    };
}

function serviceToDoc(u) {
    return {
        id:                 u._id.toString(),
        name:               u.fullName           || '',
        serviceType:        u.serviceType        || '',
        serviceAddress:     u.serviceAddress     || '',
        serviceDescription: u.serviceDescription || '',
        experienceYears:    parseInt(u.experienceYears) || 0,
        createdAt:          u.createdAt ? new Date(u.createdAt).getTime() : Date.now()
    };
}

function eventToDoc(e) {
    return {
        id:             e._id.toString(),
        title:          e.title       || '',
        description:    e.description || '',
        category:       e.category    || '',
        eventDate:      e.eventDate ? new Date(e.eventDate).getTime() : 0,
        city:           e.location?.city || '',
        entryFee:       parseFloat(e.entryFee) || 0,
        status:         e.status || 'upcoming',
        availableSlots: (e.maxAttendees || 0) - (e.attendees?.length || 0),
        thumbnail:      e.images?.[0]?.url || '',
        tags:           e.tags || []
    };
}

function mateToDoc(m) {
    return {
        id:          m._id.toString(),
        name:        m.name        || '',
        breed:       m.breed       || '',
        petType:     m.petType     || '',
        gender:      m.gender      || '',
        state:       m.location?.state    || '',
        district:    m.location?.district || '',
        description: m.description || '',
        thumbnail:   m.images?.[0]?.url  || '',
        createdAt:   m.createdAt ? new Date(m.createdAt).getTime() : Date.now()
    };
}

// ── Low-level upsert / delete ─────────────────────────────────────────────────

async function upsert(collection, doc) {
    if (!isConnected) return;
    try {
        await getClient().collections(collection).documents().upsert(doc);
    } catch (err) {
        console.warn(`[Typesense] upsert(${collection}/${doc.id}) failed:`, err.message);
    }
}

async function remove(collection, id) {
    if (!isConnected) return;
    try {
        await getClient().collections(collection).documents(String(id)).delete();
    } catch (err) {
        if (err.httpStatus !== 404) {
            console.warn(`[Typesense] delete(${collection}/${id}) failed:`, err.message);
        }
    }
}

// ── Public sync functions ─────────────────────────────────────────────────────

async function syncPet(pet)         { await upsert('pets',     petToDoc(pet)); }
async function syncProduct(product) { await upsert('products', productToDoc(product)); }
async function syncService(user)    { await upsert('services', serviceToDoc(user)); }
async function syncEvent(event)     { await upsert('events',   eventToDoc(event)); }
async function syncMate(mate)       { await upsert('mates',    mateToDoc(mate)); }

async function deletePet(id)     { await remove('pets',     id); }
async function deleteProduct(id) { await remove('products', id); }
async function deleteService(id) { await remove('services', id); }
async function deleteEvent(id)   { await remove('events',   id); }
async function deleteMate(id)    { await remove('mates',    id); }

// ── Bulk import (used by typesense-index.js script) ──────────────────────────

async function bulkImport(collection, docs) {
    if (!docs.length) return;
    const c = getClient();
    // Typesense import action=upsert replaces existing docs
    await c.collections(collection).documents().import(docs, { action: 'upsert' });
    console.log(`[Typesense] Imported ${docs.length} docs into '${collection}'`);
}

// ── Multi-search ──────────────────────────────────────────────────────────────

const QUERY_BY = {
    pets:     'name,breed,category,description',
    products: 'name,brand,category,description',
    services: 'name,serviceType,serviceDescription,serviceAddress',
    events:   'title,description,category,tags',
    mates:    'name,breed,petType,description'
};

/**
 * Search multiple collections at once via Typesense multi_search.
 * Returns { pets: [...], products: [...], services: [...], events: [...], mates: [...] }
 */
async function multiSearch(query, collections = ['pets', 'products', 'services', 'events', 'mates'], perPage = 10) {
    const c = getClient();

    const filterByCollection = {
        pets:    'available:true',
        events:  'status:upcoming'
    };

    const searches = collections.map(col => ({
        collection:    col,
        q:             query,
        query_by:      QUERY_BY[col] || 'name',
        per_page:      perPage,
        num_typos:     2,
        prefix:        true,
        sort_by:       col === 'events' ? '_text_match:desc,eventDate:asc' : '_text_match:desc',
        ...(filterByCollection[col] ? { filter_by: filterByCollection[col] } : {})
    }));

    const response = await c.multiSearch.perform({ searches }, {});

    const out = {};
    response.results.forEach((result, i) => {
        out[collections[i]] = (result.hits || []).map(h => ({
            ...h.document,
            score: h.text_match
        }));
    });
    return out;
}

module.exports = {
    initTypesense,
    ensureCollections,
    multiSearch,
    bulkImport,
    syncPet,     syncProduct,     syncService,     syncEvent,     syncMate,
    deletePet,   deleteProduct,   deleteService,   deleteEvent,   deleteMate,
    isTypesenseReady: () => isConnected,
    petToDoc, productToDoc, serviceToDoc, eventToDoc, mateToDoc
};
