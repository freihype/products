import { combineReducers } from 'redux'

import { handleActions } from 'redux-actions';

export const ADD_TODO = 'ADD_TODO';
export const EDIT_TODO = 'EDIT_TODO';
export const DELETE_TODO = 'DELETE_TODO';
export const COMPLETE_TODO = 'COMPLETE_TODO';
export const COMPLETE_ALL = 'COMPLETE_ALL';
export const CLEAR_COMPLETED = 'CLEAR_COMPLETED';

// tslint:disable-next-line:interface-name
export interface TodoItemData {
    id?: TodoItemId;
    text?: string;
    completed?: boolean;
}

export type TodoItemId = number;

export type TodoFilterType = 'SHOW_ALL' | 'SHOW_ACTIVE' | 'SHOW_COMPLETED';

export type TodoStoreState = TodoItemData[];

const initialState: TodoStoreState = [{
    id: 0,
    text: 'Use Redux',
    completed: false
}];

export const Todos = handleActions<TodoStoreState, TodoItemData>({
    [ADD_TODO]: (state, action) => {
        return [{
            id: state.reduce((maxId, todo) => Math.max(todo.id as number, maxId), -1) + 1,
            completed: false,
            ...action.payload,
        }, ...state];
    },

    [DELETE_TODO]: (state, action) => {
        return state.filter(todo => todo.id !== action.payload);
    },

    [EDIT_TODO]: (state, action) => {
        return state.map(todo => {
            return todo.id === action.payload.id
                ? { ...todo, text: action.payload.text }
                : todo;
        });
    },

    [COMPLETE_TODO]: (state, action) => {
        return state.map(todo => {
            return todo.id === action.payload
                ? { ...todo, completed: !todo.completed }
                : todo;
        });
    },

    [COMPLETE_ALL]: (state, action) => {
        const areAllMarked = state.every(todo => todo.completed);
        return state.map(todo => {
            return {
                ...todo,
                completed: !areAllMarked
            };
        });
    },

    [CLEAR_COMPLETED]: (state, action) => {
        return state.filter(todo => todo.completed === false);
    }
}, initialState);

// tslint:disable-next-line:interface-name
export interface RootState {
    todos: TodoStoreState;
}

export const RootReducer = combineReducers<RootState>({
    Todos
});

import { createAction } from 'redux-actions';

export const addTodo = createAction<TodoItemData>(ADD_TODO);
export const editTodo = createAction<TodoItemData>(EDIT_TODO);
export const deleteTodo = createAction<TodoItemId>(DELETE_TODO);
export const completeTodo = createAction<TodoItemId>(COMPLETE_TODO);
export const completeAll = createAction(COMPLETE_ALL);
export const clearCompleted = createAction(CLEAR_COMPLETED);
