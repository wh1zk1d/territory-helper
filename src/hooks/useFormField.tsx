import * as React from 'react'

export function useFormField(initialValue = '') {
  const [value, setValue] = React.useState(initialValue)

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value),
    []
  )

  const reset = () => setValue(initialValue)

  return { value, onChange, reset, bind: { value, onChange } }
}
