import { showError, showWarning } from '@/lib/toast'

interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Centrally handles Supabase errors and displays appropriate toast notifications.
 * @returns true if an error was handled, false otherwise.
 */
export function handleSupabaseError(
  error: SupabaseError | null,
  context?: string
): boolean {
  if (!error) return false

  console.error(`Supabase error [${context}]:`, error)

  // Network / connection errors
  if (
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('net::ERR')
  ) {
    showWarning('No internet connection — working offline')
    return true
  }

  // Auth errors
  if (
    error.message?.includes('JWT') ||
    error.message?.includes('invalid token') ||
    error.message?.includes('not authenticated')
  ) {
    showError('Session expired — please log in again')
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    return true
  }

  // Duplicate entry errors
  if (
    error.code === '23505' ||
    error.message?.includes('duplicate') ||
    error.message?.includes('unique')
  ) {
    if (context?.includes('product')) {
      showError('A product with this barcode already exists')
    } else if (context?.includes('user')) {
      showError('A user with this email already exists')
    } else {
      showError('This record already exists')
    }
    return true
  }

  // Foreign key errors
  if (error.code === '23503') {
    showError('Cannot delete — this record is used by other data')
    return true
  }

  // Permission errors
  if (
    error.code === '42501' ||
    error.message?.includes('permission denied') ||
    error.message?.includes('RLS')
  ) {
    showError('You do not have permission to do this')
    return true
  }

  // Row not found
  if (
    error.code === 'PGRST116' ||
    error.message?.includes('0 rows')
  ) {
    showWarning(context ? `${context} not found` : 'Record not found')
    return true
  }

  // Generic fallback
  showError(
    context
      ? `Failed to ${context} — please try again`
      : 'Something went wrong — please try again'
  )
  return true
}

/**
 * Safe wrapper for any Supabase query promise.
 */
export async function safeQuery<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFn: () => PromiseLike<{ data: T | null; error: any } | any>,
  context?: string
): Promise<T | null> {
  try {
    const response = await queryFn()
    const { data, error } = response as { data: T | null; error: SupabaseError | null }
    
    if (error) {
      handleSupabaseError(error, context)
      return null
    }
    return data
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    handleSupabaseError(
      { message },
      context
    )
    return null
  }
}
