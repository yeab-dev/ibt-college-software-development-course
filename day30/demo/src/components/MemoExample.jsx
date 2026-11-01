import { useMemo, useState } from "react";

function MemoExample() {
  const [numbers] = useState([10, 20, 30, 40]);
  const [count, setCount] = useState(0);

  const total = numbers.reduce((sum, number) => {
    console.log("Calculating Total...");
    sum + number;
  }, 0);
  //   const total = useMemo(() => {
  //     console.log("Calculating Total...");
  //     return numbers.reduce((sum, number) => sum + number, 0);
  //   }, [numbers]);

  return (
    <>
      <h1>Memo Example</h1>
      <h2>Total: {total}</h2>
      <button onClick={() => setCount(count + 1)}>Re-render: {count}</button>
    </>
  );
}

export default MemoExample;
