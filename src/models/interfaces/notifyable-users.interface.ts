import { GlobalSettings } from "../types/global-settings.type";

export interface INotifyableAction{
    notifyRelatedActions(globalSettings: GlobalSettings): Promise<void>
}