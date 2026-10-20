// The same cart, written with Redux Toolkit. NOT wired into this application —
// it is here to read beside cartStore.js, which is the Day 32 homework.
//
// Nothing imports this file, and @reduxjs/toolkit is deliberately not a
// dependency, so it will not resolve if you run it. Read it, do not run it.
//
// import { createSlice, configureStore } from "@reduxjs/toolkit";

// --- the slice -------------------------------------------------------------
//
// createSlice is your Day 30 reducer, packaged. It takes the initial state and
// the case reducers, and generates the action creators for you — the switch
// statement and the hand-written action type strings are both gone.

export const cartSlice = {
  name: "cart",
  initialState: { items: [] },
  reducers: {
    addItem: (state, action) => {
      const dish = action.payload;
      const existing = state.items.find((item) => item.id === dish.id);

      // This looks like mutation, and it is not a bug.
      //
      // Redux Toolkit runs your case reducer against an Immer *draft*: a proxy
      // that records every change you make and then produces a new object from
      // the recording. You write mutation; Immer produces immutability. The
      // rule only holds inside createSlice — the same line in a plain reducer
      // is the bug Day 30 warned about.
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...dish, quantity: 1 });
      }
    },

    removeItem: (state, action) => {
      const line = state.items.find((item) => item.id === action.payload);
      if (!line) return;

      line.quantity -= 1;
      if (line.quantity === 0) {
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
    },

    clear: (state) => {
      state.items = [];
    },
  },
};

// export const { addItem, removeItem, clear } = cartSlice.actions;
// export const store = configureStore({ reducer: { cart: cartSlice.reducer } });

// --- and in the components -------------------------------------------------
//
//   // main.jsx — Redux needs the provider that Zustand does not
//   <Provider store={store}><App /></Provider>
//
//   // any component
//   const items = useSelector((s) => s.cart.items);
//   const dispatch = useDispatch();
//   dispatch(addItem(dish));
//
// useSelector is the selector you just met in Zustand. dispatch is the dispatch
// from your own Day 30 reducer. Provider is the context provider you have used
// since Day 30. Every idea is one you already have.

// --- the three side by side ------------------------------------------------
//
// task            context + reducer          zustand                 redux toolkit
// ------------------------------------------------------------------------------
// define state    useReducer in a provider   create((set) => ({…}))  createSlice({…})
// reach a comp.   mount a Provider above     import the store        mount <Provider store>
// read a value    useContext(CartContext)    useStore(s => s.items)  useSelector(s => …)
// change it       dispatch({type:"add"})     addItem(dish)           dispatch(addItem(dish))
// re-render       every consumer             only that selector      only that selector
//
// Three vocabularies for one idea: keep shared state in one place, read only
// the part you need, change it through named actions. Redux asks for more
// setup and gives back a strict, predictable pattern that large teams rely on.
// That trade is the whole argument between the two — they are not rivals.
