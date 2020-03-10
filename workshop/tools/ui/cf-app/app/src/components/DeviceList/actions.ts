import { createAction } from 'redux-actions';
import {TodoItemData, TodoItemId} from './reducers';

import * as Actions from './constants';

export const ADD_TODO = 'ADD_TODO';
export const EDIT_TODO = 'EDIT_TODO';
export const DELETE_TODO = 'DELETE_TODO';
export const COMPLETE_TODO = 'COMPLETE_TODO';
export const COMPLETE_ALL = 'COMPLETE_ALL';
export const CLEAR_COMPLETED = 'CLEAR_COMPLETED';

export const addTodo = createAction<TodoItemData>(Actions.ADD_TODO);
export const editTodo = createAction<TodoItemData>(Actions.EDIT_TODO);
export const deleteTodo = createAction<TodoItemId>(Actions.DELETE_TODO);
export const completeTodo = createAction<TodoItemId>(Actions.COMPLETE_TODO);
export const completeAll = createAction(Actions.COMPLETE_ALL);
export const clearCompleted = createAction(Actions.CLEAR_COMPLETED);
