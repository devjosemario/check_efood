import { configureStore } from '@reduxjs/toolkit'
import cartReducer from '../store/reducers/cart'
import checkoutReducer from '../store/reducers/checkout'
import api from '../services/api'

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    checkout: checkoutReducer,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware)
})

export type RootReducer = ReturnType<typeof store.getState>
