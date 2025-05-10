import { useState } from 'react';

export default function Home() {
  const [task, setTask] = useState('');
  const [file, setFile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [fileUploadResult, setFileUploadResult] = useState(null); // to store the uploaded file URL


  const handleAddTask = async () => {
    if (!task.trim()) return;

    let uploadMessage = '';

    // Upload file to S3
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result.split(',')[1]; // remove metadata
        try {
          const uploadRes = await fetch('https://c3mbwi3no1.execute-api.us-east-1.amazonaws.com/prod/Upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileContent: base64Data,
              fileName: file.name,
            }),
          });

          const result = await uploadRes.json();
          uploadMessage = result.message || 'Upload complete';
          console.log(uploadMessage);
        } catch (err) {
          console.error('Upload failed:', err);
        }
      };
      reader.readAsDataURL(file);
    }

    // Save task to DynamoDB
    try {
      const response = await fetch('https://c3mbwi3no1.execute-api.us-east-1.amazonaws.com/prod/Tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });

      const data = await response.json();
      console.log(data.message);

      setTasks([...tasks, { text: task, completed: false }]);
      setTask('');
      setFile(null);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const toggleTask = (index) => {
    const updated = [...tasks];
    updated[index].completed = !updated[index].completed;
    setTasks(updated);
  };

  const deleteTask = (index) => {
    const updated = tasks.filter((_, i) => i !== index);
    setTasks(updated);
  };

  const uploadFile = async () => {
  if (!file) {
    alert("Please select a file first.");
    return;
  }

  // Use FileReader to read the file as Base64
  const reader = new FileReader();

  // When reading is done, send file to AWS
  reader.onloadend = async () => {
    const base64Data = reader.result.split(',')[1]; // Remove metadata like `data:application/pdf;base64,`

    try {
      const response = await fetch("https://c3mbwi3no1.execute-api.us-east-1.amazonaws.com/prod/Upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileContent: base64Data,
          fileName: file.name,
        }),
      });

      const result = await response.json();
      console.log("Upload result:", result);

      if (response.ok) {
        alert("File uploaded successfully!");
        setFileUploadResult(result.fileUrl || "Uploaded"); // Save result if available
      } else {
        alert("Upload failed: " + result.message);
      }

    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Check the console for more info.");
    }
  };

  reader.readAsDataURL(file); // Starts the read
};


  return (
    <div style={{
      padding: 30,
      maxWidth: 500,
      margin: '50px auto',
      border: '1px solid #ccc',
      borderRadius: 10,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>To-Do List</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter a task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{
            padding: 10,
            fontSize: 16,
            borderRadius: 5,
            border: '1px solid #ccc'
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 10 }}>
  <input
    type="file"
    id="fileUpload"
    onChange={(e) => setFile(e.target.files[0])}
    style={{
      padding: 5,
      borderRadius: 5,
      border: '1px solid #ccc',
    }}
  />
  <button
    onClick={uploadFile}
    style={{
      backgroundColor: '#28a745',
      color: '#fff',
      padding: '8px 12px',
      border: 'none',
      borderRadius: 5,
      cursor: 'pointer',
    }}
  >
    Upload File
  </button>
</div>


        
        
        <button
          onClick={handleAddTask}
          style={{
            padding: '10px 15px',
            fontSize: 16,
            borderRadius: 5,
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Add Task
        </button>
      </div>

      <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
        {tasks.map((t, index) => (
          <li
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 15px',
              marginBottom: 10,
              backgroundColor: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: 5
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggleTask(index)}
                style={{ marginRight: 10 }}
              />
              <span style={{
                textDecoration: t.completed ? 'line-through' : 'none',
                color: t.completed ? '#999' : '#333'
              }}>
                {t.text}
              </span>
            </div>
            <button
              onClick={() => deleteTask(index)}
              style={{
                marginLeft: 10,
                backgroundColor: '#ff4d4d',
                color: '#fff',
                border: 'none',
                borderRadius: 5,
                padding: '5px 10px',
                cursor: 'pointer'
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
