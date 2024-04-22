import Uik from "@reef-chain/ui-kit";
import React from "react";
const {Notifications} = Uik;

export interface NewNotification {
  message: string,
  aliveFor?: number,
  keepAlive?: boolean,
  children?: any
}

let notifications:Notification[] = []

const generateId = (): number => {
  let id = Math.floor(Math.random() * 1000000)

  const isUnique = ((): boolean => {
      //@ts-ignore
    return !notifications.find(item => item.id === id)
  })()

  if (!isUnique) id = generateId()

  return id
}

const add = ({
  type,
  params
}: {
  type: "info" | "danger" | "success",
  params?: NewNotification | string
}) => {
  // Clear all existing notifications
  notifications = [];

  const id = generateId()
  if (typeof params === "string") {
    params = { message: params }
  }
  //@ts-ignore
  notifications.push({ id, type, ...params })
  render()
}

const remove = (id: number) => {
  setTimeout(() => {
      //@ts-ignore
    const notification = notifications.find(notification => notification.id === id)
    if (notification) {
      const index = notifications.indexOf(notification)
      notifications.splice(index, 1)
      render()
    }
  }, 0.25 * 1000)
}
import ReactDOM from 'react-dom';

class Container {
  id: string
  root: HTMLElement

  constructor (id: string) {
    this.id = id
    this.root = null
  }

  getElement = () => {
    return document.getElementById(this.id)
  }

  create = () => {
    let el = this.getElement()
    
    if (!el) {
      el = document.createElement("div")
      el.id = this.id
      document.body.appendChild(el)
    }

    this.root = el
  }

  render = (children) => {
    if (!this.root) this.create()
    if (this.root) ReactDOM.render(children, this.root)
  }

  destroy = () => {
    if (!this.root) return
    this.root.remove()
    this.root = null
  }
}

const container = new Container("uik-notifications-container")

const render = () => {
  if (!notifications.length) {
    container.destroy()
    return
  }

  container.render(
    //@ts-ignore
    <Notifications
      notifications={notifications as any}
      onClose={remove}
    />
  )
}

const info = (params: NewNotification | string) => { add({ type: "info", params }) }
const success = (params: NewNotification | string) => { add({ type: "success", params }) }
const danger = (params: NewNotification | string) => { add({ type: "danger", params }) }

const notify = { info, success, danger }



export const enableNetworkToggleOption = (nwToggleEnableClicks:number,setNwToggleEnableClicks)=>{
    if(nwToggleEnableClicks<7){
        setNwToggleEnableClicks(nwToggleEnableClicks+1)
      if(nwToggleEnableClicks+1==7){
        notify.success("Enabled Network Toggle Successfully!")
      }else{
        notify.info(`Click ${7-1-nwToggleEnableClicks} more ${7-1-nwToggleEnableClicks>1?"times":"time"} to enable Network Toggle`)
      }
      }
}