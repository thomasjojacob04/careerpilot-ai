import { useCallback, useEffect, useState } from "react";
import api, { errMsg } from "../api/client";

/** GET helper: returns { data, loading, error, reload, setData }. */
export default function useApi(path, { skip = false } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData((await api.get(path)).data);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { if (!skip) load(); }, [load, skip]);
  return { data, loading, error, reload: load, setData };
}
