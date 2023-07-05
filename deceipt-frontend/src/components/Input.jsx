import { Icon } from "@iconify/react";
import React, { useEffect, useRef, useState } from "react";
import styles from "./Input.module.css";

const Input = ({
  placeholder,
  type,
  register,
  name,
  validationSchema,
  labelValue,
  icon,
  errors,
  required,
}) => {
  const [viewPass, setViewPass] = useState(false);
  return (
    <div>
      <div className={styles.fieldContainer}>
        {icon && <Icon {...icon} />}
        <div className={styles.field}>
          <input
            placeholder={placeholder}
            type={viewPass ? "text" : type}
            {...register(name, validationSchema)}
          />
          <label htmlFor={name}>
            {labelValue}
            {required && "*"}
          </label>
          {type === "password" && (
            <Icon
              className={styles.viewPassword}
              icon={`mdi:eye-${viewPass ? "" : "off-"}outline`}
              onClick={() => {setViewPass(!viewPass)}}
              color="rgba(var(--primary-color),1)"
              width="25"
            />
          )}
        </div>
      </div>
      <p className={styles.error}>{errors && errors[name]?.message}</p>
    </div>
  );
};

export default Input;
