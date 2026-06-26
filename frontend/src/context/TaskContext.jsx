// src/context/TaskContext.jsx
import { createContext, useContext, useReducer, useCallback } from 'react'
import { taskApi } from '../services/api'

const TaskContext = createContext(null)

const initialState = {
  tasks: [],
  loading: false,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload }
    case 'SET_ERROR':   return { ...state, error: action.payload, loading: false }
    case 'SET_TASKS':   return { ...state, tasks: action.payload, loading: false }
    case 'ADD_TASKS':
      // Merge agent-created tasks, avoiding duplicates by id
      const ids = new Set(state.tasks.map(t => t.id))
      const newOnes = action.payload.filter(t => !ids.has(t.id))
      return { ...state, tasks: [...newOnes, ...state.tasks] }
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
      }
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter(t => t.id !== action.payload) }
    default: return state
  }
}

export function TaskProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchTasks = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const tasks = await taskApi.list()
      dispatch({ type: 'SET_TASKS', payload: tasks })
    } catch (e) {
      dispatch({ type: 'SET_ERROR', payload: e.message })
    }
  }, [])

  const addTask = useCallback(async (payload) => {
    const task = await taskApi.create(payload)
    dispatch({ type: 'ADD_TASKS', payload: [task] })
    return task
  }, [])

  const updateTask = useCallback(async (id, payload) => {
    const task = await taskApi.update(id, payload)
    dispatch({ type: 'UPDATE_TASK', payload: task })
    return task
  }, [])

  const completeTask = useCallback(async (id) => {
    const task = await taskApi.complete(id)
    dispatch({ type: 'UPDATE_TASK', payload: task })
  }, [])

  const deleteTask = useCallback(async (id) => {
    await taskApi.delete(id)
    dispatch({ type: 'REMOVE_TASK', payload: id })
  }, [])

  const rescheduleTask = useCallback(async (id) => {
    const task = await taskApi.reschedule(id)
    dispatch({ type: 'UPDATE_TASK', payload: task })
  }, [])

  // Called by agent when it creates/modifies tasks
  const mergeAgentTasks = useCallback((agentTasks) => {
    if (!agentTasks?.length) return
    agentTasks.forEach(t => {
      const exists = state.tasks.find(existing => existing.id === t.id)
      if (exists) {
        dispatch({ type: 'UPDATE_TASK', payload: t })
      } else {
        dispatch({ type: 'ADD_TASKS', payload: [t] })
      }
    })
  }, [state.tasks])

  return (
    <TaskContext.Provider value={{
      ...state,
      fetchTasks,
      addTask,
      updateTask,
      completeTask,
      deleteTask,
      rescheduleTask,
      mergeAgentTasks,
    }}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTasks = () => {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error('useTasks must be inside TaskProvider')
  return ctx
}
