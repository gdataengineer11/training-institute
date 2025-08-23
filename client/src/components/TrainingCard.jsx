import React from "react";

const TrainingCard = ({ data }) => {
  const handleEnroll = () => {
    fetch("http://localhost:3000/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course: data.title })
    })
      .then(res => res.json())
      .then(response => {
        alert(response.message);
      })
      .catch(() => alert("Error enrolling"));
  };

  return (
    <div className="card">
      <h3>{data.icon} {data.title}</h3>
      <p>{data.description}</p>
      <button onClick={handleEnroll}>Enroll Now</button>
    </div>
  );
};

export default TrainingCard;
