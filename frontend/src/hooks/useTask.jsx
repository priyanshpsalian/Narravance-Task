import { useState } from "react";
import axios from "axios";

export const useTask = (startYear, endYear, models, region, size) => {
  const [taskId, setTaskId] = useState(null);
  const [taskStatus, setTaskStatus] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);

  const createTask = async () => {
    setLoading(true);
    const json = {
      startYear,
      endYear,
      models: models.split(",").map((m) => m.trim()),
      region,
      size,
    };
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/create_task",
        json
      );
      setTaskId(response.data.task_id);
      setTaskStatus("pending");
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  return {
    taskId,
    taskStatus,
    data,
    setData,
    setFilteredData,
    loading,
    setLoading,
    createTask,
  };
};
