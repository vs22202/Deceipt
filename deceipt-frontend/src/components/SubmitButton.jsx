import React from 'react'
import styles from './SubmitButton.module.css'
const SubmitButton = ({value}) => {
  return (
      <input className={ styles.submitBtn} type="submit" value={value} />
  )
}

export default SubmitButton