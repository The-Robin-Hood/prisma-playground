import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/select";
import { Queries, initialAppState, mandatoryParams } from "./lib/const";
import { jsonParseLinter } from "./lib/json-lint";
import { Button } from "./components/button";

import CodeMirror from "@uiw/react-codemirror";
import { githubDark } from "@uiw/codemirror-theme-github";
import { json } from "@codemirror/lang-json";
import { linter } from "@codemirror/lint";
import { Toaster, toast } from "react-hot-toast";
import { CheckCheck, Copy, Eraser } from "lucide-react";

const App = () => {
  const socket = useRef<WebSocket | null>(null);
  const [code, setCode] = useState("");
  const [appState, setAppState] = useState(initialAppState);
  const updateAppState = (newState: Partial<typeof appState>) =>
    setAppState((prev) => ({ ...prev, ...newState }));

  useEffect(() => {
    socket.current = new WebSocket("ws://localhost:3000");
    socket.current.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (!data.status) {
        toast.error("Error occured while executing the query");
        updateAppState({ processing: false, error: data.error });
      } else {
        if (data.availableFields) {
          updateAppState({
            dbTables: {
              availableFields: data.availableFields,
              availableTables: data.availableTables,
            },
          });
        }
        if (data.result) {
          toast.success("Query executed successfully");
          updateAppState({ processing: false, result: data.result });
        }
      }
    };

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (appState.form.query !== "") {
      const params = mandatoryParams[appState.form.query]
        ? mandatoryParams[appState.form.query]
        : "{}";
      setCode(params);
    }
  }, [appState.form.query]);

  useEffect(() => {
    updateAppState({ form: { ...appState.form, condition: code } });
  }, [code]);

  const handleExecute = () => {
    updateAppState({ processing: true, error: null, result: null });
    if (code !== "") {
      try {
        JSON.parse(code);
      } catch (e) {
        toast.error("Invalid JSON");
        updateAppState({ processing: false });
        return;
      }
    }
    socket.current?.send(JSON.stringify(appState.form));
  };

  const executeDisabledCases = () => {
    const isTableEmpty = appState.form.table === "";
    const isQueryEmpty = appState.form.query === "";
    const isConditionEmpty = appState.form.condition === "";
    const isProcessing = appState.processing;
    const isSocketEmpty = !socket.current;
    const queriesWithoutCondition = ["findFirst", "firstMany", "count"];
    const query = appState.form.query;

    if (isTableEmpty || isQueryEmpty || isProcessing || isSocketEmpty)
      return true;

    if (!queriesWithoutCondition.includes(query) && isConditionEmpty)
      return true;

    return false;
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-appbg flex md:gap-5 lg:gap-10 xl:gap-52 justify-center items-center">
      <div className="relative flex flex-col justify-center items-center">
        <h1 className="font-sans text-3xl text-white mb-5">
          Prisma Query Executor
        </h1>

        <div className="flex gap-7">
          <Select
            onValueChange={(e) =>
              updateAppState({ form: { ...appState.form, table: e } })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select the table" />
            </SelectTrigger>
            <SelectContent>
              {appState.dbTables.availableTables.map((table: string) => (
                <SelectItem key={table} value={table}>
                  {table}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={(e) =>
              updateAppState({ form: { ...appState.form, query: e } })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select the Query" />
            </SelectTrigger>
            <SelectContent>
              {Queries.map((query) => (
                <SelectItem key={query} value={query}>
                  {query}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <CodeMirror
          value={code}
          onChange={setCode}
          className="mt-5 border"
          height="300px"
          width="500px"
          editable
          theme={githubDark}
          basicSetup={{
            defaultKeymap: true,
            indentOnInput: true,
            closeBrackets: true,
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            autocompletion: true,
          }}
          extensions={[json(), linter(jsonParseLinter())]}
          placeholder={"Enter the conditions here"}
          
        />

        <Button
          variant="secondary"
          className="w-24 h-9 mt-5"
          disabled={executeDisabledCases()}
          onClick={handleExecute}
        >
          Execute
        </Button>
        <Toaster
          containerClassName="!mb-10"
          toastOptions={{
            className: "bg-gray-800 text-white font-semibold min-w-[400px]",
          }}
          reverseOrder
          position="bottom-center"
        />
      </div>
      <div className="custom-backdrop">
        <div className="w-full min-h-[500px] max-h-[600px] rounded-xl bg-opacity-10 bg-gray-50 border border-white/25 backdrop-blur-2xl drop-shadow-2xl text-white relative pr-1">
          <div className="w-full h-[500px] overflow-y-auto p-10 custom-scrollbar">
            {(appState.result || appState.error) && (
              <>
                <Button
                  title="Copy"
                  disabled={appState.copied}
                  className="bg-transparent hover:bg-white/30 w-7 h-7 absolute right-14 top-5 rounded border border-white/50 flex item-center justify-center p-1 disabled:opacity-100"
                  onClick={() => {
                    const toCopied = appState.result
                      ? appState.result
                      : appState.error;
                    navigator.clipboard.writeText(
                      JSON.stringify(toCopied, null, 2)
                    );
                    updateAppState({ copied: true });
                    setTimeout(() => {
                      updateAppState({ copied: false });
                    }, 2000);
                  }}
                >
                  {appState.copied ? (
                    <CheckCheck className="h-full text-white" />
                  ) : (
                    <Copy className="h-full text-white" />
                  )}
                </Button>

                <Button
                  title="Clear Output"
                  className="bg-transparent hover:bg-white/30 w-7 h-7 absolute right-5 top-5 rounded border border-white/50 flex item-center justify-center p-1 disabled:opacity-100"
                  onClick={() =>
                    updateAppState({
                      result: null,
                      error: null,
                    })
                  }
                >
                  <Eraser className="h-full text-white" />
                </Button>
              </>
            )}

            {appState.result && (
              <pre>{JSON.stringify(appState.result, null, 2)}</pre>
            )}

            {!appState.result && !appState.processing && !appState.error && (
              <div className="flex flex-col justify-center items-center w-full h-full">
                <div className="text-xl font-semibold text-gray-200 text-center opacity-50">
                  <p>
                    Execute some query for <br />
                    the magic to happen 🧙‍♂️
                  </p>
                </div>
              </div>
            )}

            {appState.processing && (
              <div className="flex justify-center items-center w-full h-full">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-white"></div>
              </div>
            )}

            {appState.error && (
              <pre className="text-red-300">{appState.error}</pre>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;
