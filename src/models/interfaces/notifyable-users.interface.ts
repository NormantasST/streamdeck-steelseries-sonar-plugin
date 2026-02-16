import { GlobalSettings } from "../types/global-settings.type";

export interface INotifyableAction{
    notifyActions(globalSettings: GlobalSettings): Promise<void>
}