import Uik from "@reef-chain/ui-kit"

export const enableNetworkToggleOption = (nwToggleEnableClicks,setNwToggleEnableClicks)=>{
    if(nwToggleEnableClicks<7){
        setNwToggleEnableClicks(nwToggleEnableClicks+1)
      if(nwToggleEnableClicks+1==7){
        Uik.notify.success("Enabled Network Toggle Successfully!")
      }else{
        Uik.notify.info(`Click ${7-1-nwToggleEnableClicks} more ${7-1-nwToggleEnableClicks>1?"times":"time"} to enable Network Toggle`)
      }
      }
}