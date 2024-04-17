import { useEffect, useState } from "react";
import { healthCheck } from "../background/service_worker";

export const useServiceWorkerStatus=()=>{
    const [isRunning,setIsRunning] = useState<boolean>(true);

    useEffect(() => {
      const intervalId = setInterval(() => {      
        healthCheck().then((v)=>
        {
            setIsRunning(v)
        })
    }, 1000);
      return () => clearInterval(intervalId);
    }, []);

    return {
        isRunning
    }
}