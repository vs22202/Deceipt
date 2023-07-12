import React from 'react'
import styles from './IconButton.module.css';
const IconButton = ({type='button',children,icon,flexFlow='',size='md',shadow='',active=false}) => {
  return (
    <button type={type} className={`${styles.btn} ${active ? styles.active : ''}`}style={{ flexFlow: flexFlow}} >
      <img className={`${styles[size] ? styles[size] :'' } ${styles[shadow] ? styles[shadow] : '' }`} src={icon.url} alt={icon.alt}/>
      {children ? <p>{children}</p> : ''}
    </button>
  )
}

export default IconButton