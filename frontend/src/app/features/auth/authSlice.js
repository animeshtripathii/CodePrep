import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient, { API_BASE_URL, API_DEV_PORT } from "../../../utils/axiosClient.js";

const AUTH_TOKEN_KEY = "codeprep_auth_token";

const persistAuthToken = (token) => {
    if (!token) return;
    try {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch {
        // Ignore storage errors in private mode.
    }
};

const clearPersistedAuthToken = () => {
    try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch {
        // Ignore storage errors in private mode.
    }
};

const resolveAuthErrorMessage = (err, fallbackMessage) => {
    const serverMessage = err?.response?.data?.message;
    if (serverMessage) return serverMessage;

    if (err?.code === "ERR_NETWORK") {
        return `Cannot reach server (${API_BASE_URL}). Ensure backend is running and port ${API_DEV_PORT} is allowed in firewall.`;
    }

    return err?.message || fallbackMessage;
};

export const registerUser = createAsyncThunk("auth/register",
    async (userData, { rejectWithValue }) => {
        try {
            const response = await axiosClient.post("/user/register", userData);
            console.log(response.data.user);
            persistAuthToken(response?.data?.user?.token);
            return response.data.user;
        }
        catch (err) {
            return rejectWithValue(resolveAuthErrorMessage(err, "Registration failed"));
        }
    });

export const loginUser = createAsyncThunk("auth/login",
    async (credentials, { rejectWithValue }) => {
        try {

            const response = await axiosClient.post("/user/login", credentials);
            persistAuthToken(response?.data?.user?.token);
            return response.data.user;
        }
        catch (err) {
            return rejectWithValue(resolveAuthErrorMessage(err, "Login failed"));
        }
    });

export const checkAuthStatus = createAsyncThunk("auth/check",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosClient.get("/user/check");
            return response.data.user;
        }
        catch (err) {
            return rejectWithValue(resolveAuthErrorMessage(err, "Authentication check failed"));
        }
    });

export const logoutUser = createAsyncThunk("auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            await axiosClient.post("/user/logout");
            clearPersistedAuthToken();
            return null; // Clear user data on logout
        }
        catch (err) {
            return rejectWithValue(resolveAuthErrorMessage(err, "Logout failed"));
        }
    });
const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        loading: true, // Set initial loading to true
        error: null,
        isAuthenticated: false,
        problemSolved: [] // Add problemSolved to the state
    },
    reducers: {
        // Add a reducer to handle initial load completion if needed
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        updateUserTokens: (state, action) => {
            if (state.user) {
                state.user.tokens = action.payload;
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.problemSolved = action.payload.problemSolved || []; // Ensure problemSolved is set
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong during registration";
                state.user = null;
                state.isAuthenticated = false;
            })
            //Login user case
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.problemSolved = action.payload.problemSolved || [];
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong during login";
                state.user = null;
                state.isAuthenticated = false;
            })

            //checkAuth cases
            .addCase(checkAuthStatus.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
                state.isAuthenticated = !!action.payload;
                state.problemSolved = action.payload.problemSolved || [];
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            //logout cases
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.loading = false;
                state.isAuthenticated = false;
                state.problemSolved = []; // Reset problemSolved on logout
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state, action) => {
                state.error = action.payload || "Something went wrong during logout";
                state.loading = false;
                state.user = null;
                state.isAuthenticated = false;
            })
            .addCase(logoutUser.pending, (state) => {
                state.error = null;
                state.loading = true;
            })
    }
});
export const { setLoading, updateUserTokens } = authSlice.actions;
export default authSlice.reducer;