import React, { useEffect, useRef,useState } from "react";
import { getUserTransaction } from "../firebase";
import styles from "./Home.module.css";
const Home = ({ uid }) => {
  const tableRef = useRef();
  const [tableFields, setTableFields] = useState(false);
  useEffect(() => {
    getUserTransaction(uid).then((data) => {
      tableRef.current.innerHTML = " ";

      Object.entries(data).forEach((trans) => {
        const [file, result] = trans;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${result.name}</td>
          <td>${result.date}</td>
          <td>${result.total}</td>
          <td><a href="http://localhost:5000/getImage/${file}" target="_blank">View Image</a></td>
        `;
        tableRef.current.appendChild(row);
        setTableFields(true);
      })
    });
  }, []);
  return (
    <div className = {styles.container}>
      <table >
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Total</th>
            <th>Receipt</th>
          </tr>
        </thead>
        <tbody ref={tableRef}>
        </tbody>
      
      </table>
      {!tableFields && <p>No Entries Yet</p> }
    </div>
  );
};

export default Home;
