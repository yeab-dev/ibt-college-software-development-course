import { useState, useEffect } from "react";

export default function Timer() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    console.log("timer is still running");
    const id = setInterval(() => {
      setSeconds((s) => {
        console.log("current secconds:", s);
        return s + 1;
      });
    }, 1000);

    return () => {
      console.log("Cleaning up interval");
      clearInterval(id);
    };
  }, []);
  return (
    <div>
      <h1>Timer</h1>
      <h2>{seconds} seconds</h2>
    </div>
  );
}
