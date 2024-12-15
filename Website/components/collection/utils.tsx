import { CollectionData } from "@letscook/sdk/dist/state/collections";

export function findCollection(list: CollectionData[], page_name: string | string[]) {
    if (list === null || list === undefined || page_name === undefined || page_name === null) return null;

    let launchList = list.filter(function (item) {
        //console.log(new Date(bignum_to_num(item.launch_date)), new Date(bignum_to_num(item.end_date)))
        return item.page_name == page_name;
    });

    if (launchList.length === 0) return null;

    return launchList[0];
}
