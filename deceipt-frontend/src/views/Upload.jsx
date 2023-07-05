import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { batchUploadResults, currentUser } from "../firebase";
import { v4 as uuid } from "uuid";
import styles from "./Upload.module.css";
import SubmitButton from "../components/SubmitButton";

const Upload = ({ email, uid }) => {
  const { handleSubmit, register } = useForm();
  const [submissionStatus, setSubmissionStatus] = useState("NS");
  const navigate = useNavigate();
  const handleForm = (data) => {
    setSubmissionStatus("S");
    const images = Array.from(data.images);
    const formdata = new FormData();
    images.forEach((image) => {
      const filename = email + "__" + uuid().slice(0, 8) +'.'+ image.name.split('.').pop();
      formdata.append("images", image, filename);
    });
    fetch("http://localhost:5000/uploadImages", {
      method: "POST",
      body: formdata,
    }).then(res=> res.json()).then((res) => {
      batchUploadResults(res, uid).then(() => {
        localStorage.setItem("uploadStatus", "success");
        setSubmissionStatus("SS");
        document.querySelector("[data-navigate = '/']").click();
      });
    });
  };
  return (
    <div>
      <form onSubmit={handleSubmit(handleForm)} style={{ marginInline: "auto" , width:"70%",padding:"0.25em"}}>
        {submissionStatus == "SS" && <div>Images Uploaded Successfully</div>}
        {submissionStatus == "S" && <div>Images Being Uploaded</div>}
        <input
          type="file"
          accept="image/*"
          {...register("images", { required: true })}
          multiple
          style={{ marginBottom: "1em" , marginInline:"auto",width:"max-content"}}
        />
        <SubmitButton type="submit" value="Upload"  />
      </form>
    </div>
  );
};

export default Upload;
