import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const API_BASE_URL = `${API_URL}/api`;

// ==================== Async Thunks ====================

// Fetch wallet data (balance, transactions, GST info for admin)
export const fetchWalletData = createAsyncThunk(
  'wallet/fetchWalletData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/wallet`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch wallet data');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Fetch service provider wallet balance
export const fetchServiceProviderWallet = createAsyncThunk(
  'wallet/fetchServiceProviderWallet',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/service-provider/wallet`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch wallet balance');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Add money to wallet
export const addMoneyToWallet = createAsyncThunk(
  'wallet/addMoney',
  async ({ amount, paymentMethod, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/wallet/add-money`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod,
          paymentDetails
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to add money');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Transfer/withdraw money from wallet
export const transferMoneyFromWallet = createAsyncThunk(
  'wallet/transferMoney',
  async ({ amount, transferType, transferDetails }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user/wallet/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: parseFloat(amount),
          transferType,
          transferDetails
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to transfer money');
      }
      
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// ==================== Wallet Slice ====================

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    transactions: [],
    statistics: {
      totalCredits: 0,
      totalDebits: 0,
      netFromTransactions: 0,
      totalTransactionCount: 0,
      displayedTransactionCount: 0
    },
    gstInfo: {
      totalRevenue: 0,
      gstAmount: 0,
      netRevenue: 0
    },
    loading: false,
    error: null,
    processing: false, // For add/transfer operations
  },
  reducers: {
    // Clear wallet data (useful for logout)
    clearWalletData: (state) => {
      state.balance = 0;
      state.transactions = [];
      state.statistics = {
        totalCredits: 0,
        totalDebits: 0,
        netFromTransactions: 0,
        totalTransactionCount: 0,
        displayedTransactionCount: 0
      };
      state.gstInfo = {
        totalRevenue: 0,
        gstAmount: 0,
        netRevenue: 0
      };
      state.error = null;
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Update balance locally (for optimistic updates)
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch Wallet Data
    builder
      .addCase(fetchWalletData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletData.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance || 0;
        state.transactions = action.payload.transactions || [];
        
        // Update statistics if provided by backend
        if (action.payload.statistics) {
          state.statistics = action.payload.statistics;
        }
        
        // Update GST info if provided (for admin users)
        if (action.payload.gstInfo) {
          state.gstInfo = action.payload.gstInfo;
        }
      })
      .addCase(fetchWalletData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wallet data';
      });

    // Fetch Service Provider Wallet
    builder
      .addCase(fetchServiceProviderWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceProviderWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance || 0;
      })
      .addCase(fetchServiceProviderWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wallet balance';
      });

    // Add Money to Wallet
    builder
      .addCase(addMoneyToWallet.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(addMoneyToWallet.fulfilled, (state, action) => {
        state.processing = false;
        // Update balance and transactions with the new data
        if (action.payload.balance !== undefined) {
          state.balance = action.payload.balance;
        }
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
        }
      })
      .addCase(addMoneyToWallet.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || 'Failed to add money';
      });

    // Transfer Money from Wallet
    builder
      .addCase(transferMoneyFromWallet.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(transferMoneyFromWallet.fulfilled, (state, action) => {
        state.processing = false;
        // Update balance and transactions with the new data
        if (action.payload.balance !== undefined) {
          state.balance = action.payload.balance;
        }
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
        }
      })
      .addCase(transferMoneyFromWallet.rejected, (state, action) => {
        state.processing = false;
        state.error = action.payload || 'Failed to transfer money';
      });
  }
});

export const { clearWalletData, clearError, updateBalance } = walletSlice.actions;
export default walletSlice.reducer;
