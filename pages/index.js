import { useState } from 'react';

export default function Home() {
  const [task, setTask] = useState('');
  const [tasks, setTasks] = useState([]);

  const addTask = async () => {
    if (task.trim()) {
      try {
        const response = await fetch("https://c3mbwi3no1.execute-api.us-east-1.amazonaws.com/prod//Tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task }),
        });

        const result = await response.json();
        console.log("Response from Lambda:", result);

        setTasks([...tasks, { text: task, completed: false }]);
        setTask('');
      } catch (error) {
        console.error("Error sending task:", error);
      }
    }
  };

  const toggleTask = (index) => {
    const updatedTasks = [...tasks];
    updatedTasks[index].completed = !updatedTasks[index].completed;
    setTasks(updatedTasks);
  };

  const deleteTask = (index) => {
    const updatedTasks = tasks.filter((_, i) => i !== index);
    setTasks(updatedTasks);
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

      <div style={{ display: 'flex', marginBottom: 20 }}>
        <input
          type="text"
          placeholder="Enter a task"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          style={{
            flex: 1,
            padding: 10,
            fontSize: 16,
            borderRadius: 5,
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={addTask}
          style={{
            padding: '10px 15px',
            marginLeft: 10,
            fontSize: 16,
            borderRadius: 5,
            backgroundColor: '#0070f3',
            color: '#fff',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Add
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
