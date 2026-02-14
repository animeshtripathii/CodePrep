import {createAsyncThunk, createSlice} from "@reduxjs/toolkit";
import axiosClient from "../../../utils/axiosClient.js";

export const registerUser=createAsyncThunk("auth/register",
    async(userData,{rejectWithValue})=>{
        try{
            const response=await axiosClient.post("/user/register",userData);
            console.log(response.data.user);
            return response.data.user;
        }
        catch(err){
            return rejectWithValue(err.response.data.message || "Registration failed");
        }
    });

export const loginUser=createAsyncThunk("auth/login",
    async(credentials,{rejectWithValue})=>{
        try{

const response=await axiosClient.post("/user/login",credentials);
            return response.data.user;
        }
        catch(err){
            return rejectWithValue(err.response.data.message || "Login failed");
        }
    });

 export const checkAuthStatus=createAsyncThunk("auth/check",
    async(_, {rejectWithValue})=>{
        try{
            const response=await axiosClient.get("/user/check");
            return response.data.user;
        }
        catch(err){
            return rejectWithValue(err.response.data.message || "Authentication check failed");
        }
    });

export const logoutUser=createAsyncThunk("auth/logout",
    async(_, {rejectWithValue})=>{
        try{
            await axiosClient.post("/user/logout");
            return null; // Clear user data on logout
        }
        catch(err){
            return rejectWithValue(err.response.data.message || "Logout failed");
        }
    });
const authSlice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        loading:false,
        error:null,
        isAuthenticated:false,
    },
    reducers:{},
    extraReducers:(builder)=>{
        builder
        .addCase(registerUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(registerUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.user=action.payload;
            state.isAuthenticated=!!action.payload;
        })
        .addCase(registerUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload||"Something went wrong during registration";
            state.user=null;
            state.isAuthenticated=false;
        })
        //Login user case
        .addCase(loginUser.pending,(state)=>{
            state.loading=true;
            state.error=null;
        })
        .addCase(loginUser.fulfilled,(state,action)=>{
            state.loading=false;
            state.user=action.payload;
            state.isAuthenticated=!!action.payload;
        })
        .addCase(loginUser.rejected,(state,action)=>{
            state.loading=false;
            state.error=action.payload||"Something went wrong during login";
            state.user=null;
            state.isAuthenticated=false;
        })

        //checkAuth cases
        .addCase(checkAuthStatus.fulfilled,(state,action)=>{
            state.user=action.payload;
            state.isAuthenticated=!!action.payload;
        })
        .addCase(checkAuthStatus.rejected,(state,action)=>{
            state.user=null;
            state.isAuthenticated=false;
        })
        //logout cases
        .addCase(logoutUser.fulfilled,(state)=>{
            state.user=null;
            state.loading=false;
            state.isAuthenticated=false;
            state.error=null;
        })
        .addCase(logoutUser.rejected,(state,action)=>{
            state.error=action.payload||"Something went wrong during logout";
            state.loading=false;
            state.user=null;
            state.isAuthenticated=false;
        })
        .addCase(logoutUser.pending,(state)=>{
            state.error=null;
            state.loading=true;
        })
    }
});
export default authSlice.reducer;