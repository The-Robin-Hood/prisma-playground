import { useState, useEffect, useRef, Fragment } from "react";

const App = () => {
  const socket = useRef<WebSocket | null>(null);
  const [tables, setTables] = useState("");
  const [query, setQuery] = useState("findMany");
  const [field, setField] = useState("");
  const [result, setResult] = useState([]);
  const [error, setError] = useState({});
  const [availableTables, setAvailableTables] = useState<string[]>([]);

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:3000");
    socket.current.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.availableTables) {
        setAvailableTables(data.availableTables);
      } else if (data.result) {
        setResult(data.result);
      } else if (data.error) {
        setError(data);
      }
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  const executeQuery = () => {
    const fullQuery = `${tables}.${query}(${field})`;
    console.log(fullQuery);
    socket.current!.send(JSON.stringify({ query: fullQuery }));
  };

  const ResultDisplay = ({
    result,
    error,
  }: {
    result: string[];
    error: any;
  }) => {
    const jsonStyle = {
      color: "yellow",
    };

    console.log(error);

    return (
      <div className="mt-5 h-full w-full bg-black opacity-90 text-white p-6 rounded shadow-md">
        <pre className={error ? "text-red-500" : "text-green-300"}>
          {error && error.error ? (
            `Error: ${error.error} \nDetails ${error.details} `
          ) : (
            <span>
              {result.map((item, index) => {
                console.log(item);
                const parsedItem = item;
                return (
                  <Fragment key={index}>
                    {Object.entries(parsedItem).map(([key, value]) => (
                      <Fragment key={key}>
                        <span style={{ color: "white" }}>
                          {JSON.stringify(key)}
                        </span>
                        : <span style={jsonStyle}>{JSON.stringify(value)}</span>
                        <br />
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
            </span>
          )}
        </pre>
      </div>
    );
  };

  return (
    <div className="font-sans bg-gray-100 p-6 h-screen">
      <div className="max-w-md mx-auto bg-white rounded p-6 shadow-md">
        <h1 className="text-2xl font-bold mb-4">Prisma Query Executor</h1>

        <form id="queryForm">
          <div className="mb-4">
            <label
              htmlFor="tablesInput"
              className="block text-sm font-medium text-gray-600"
            >
              Tables:
            </label>
            <input
              type="text"
              id="tablesInput"
              className="mt-1 p-2 w-full border rounded"
              value={tables}
              onChange={(e) => setTables(e.target.value)}
              list="tableSuggestions"
            />
            <datalist id="tableSuggestions">
              {availableTables.map((table, index) => (
                <option key={index} value={table} />
              ))}
            </datalist>
          </div>

          <div className="mb-4">
            <label
              htmlFor="querySelect"
              className="block text-sm font-medium text-gray-600"
            >
              Prisma Query:
            </label>
            <select
              id="querySelect"
              className="mt-1 p-2 w-full border rounded"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            >
              <option value="findMany">findMany</option>
              <option value="findOne">findOne</option>
            </select>
          </div>

          <div className="mb-4">
            <label
              htmlFor="fieldInput"
              className="block text-sm font-medium text-gray-600"
            >
              Field:
            </label>
            <input
              type="text"
              id="fieldInput"
              placeholder="e.g., { where: { id: 1 } }"
              className="mt-1 p-2 w-full border rounded"
              value={field}
              onChange={(e) => setField(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={executeQuery}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Execute Query
          </button>
        </form>
      </div>
      <ResultDisplay result={result} error={error} />
    </div>
  );
};

export default App;
