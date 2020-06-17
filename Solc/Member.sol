pragma solidity >=0.4.22 <0.7.0;

import {Utils} from './Utils.sol';

library Member
{
    struct Person
    {
        string name;
        uint ID;
    }

    struct PersonIndex
    {
        Person person;
        uint flag;
    }

    struct MapList
    {
        mapping(address => PersonIndex) dataMap;
        address[] keyList;
    }

    struct MemberList
    {
        MapList register;
        MapList reject;
        MapList confirm;
    }

    function Insert(MemberList storage self,address addr,string memory name, uint ID) public returns (bool){
        bool isExist = (self.register.dataMap[addr].flag != 0);
        self.register.dataMap[addr].person = Person(name,ID);
        if(!isExist)
        {
            self.register.keyList.push(addr);
            self.register.dataMap[addr].flag = 1;
        }

        deleteElement(self.confirm,addr);
        deleteElement(self.reject,addr);

        return isExist;
    }

    function StatusChange(MapList storage From, MapList storage To, address addr) public returns (bool){
        if(From.dataMap[addr].flag == 0) return false;

        bool isExist = (To.dataMap[addr].flag != 0);
        To.dataMap[addr].person = From.dataMap[addr].person;
        if(!isExist)
        {
            To.keyList.push(addr);
            To.dataMap[addr].flag = 1;
        }
        deleteElement(From,addr);

        return true;
    }

    function ContainKey(MapList storage ml, address addr) public view returns (bool){
        return ml.dataMap[addr].flag != 0;
    }

    function deleteElement(MapList storage ml, address addr) internal {
        if(ml.dataMap[addr].flag == 0) return;

        delete ml.dataMap[addr];

        address[] memory newAddr = new address[](ml.keyList.length-1);
        bool isDel = false;
        for(uint i = 0; i<ml.keyList.length; i++)
        {
            if(ml.keyList[i] == addr)
            {
                isDel = true;
            }
            else
            {
                if(isDel) newAddr[i-1] = ml.keyList[i];
                else newAddr[i] = ml.keyList[i];
            }
        }
        if(isDel) ml.keyList = newAddr;
    }

    function GetList(MapList storage data) public view returns (address[] memory,string memory,uint[] memory,uint[] memory){
        string memory names;
        uint[] memory offset = new uint[](data.keyList.length);
        uint[] memory IDs = new uint[](data.keyList.length);

        for(uint i = 0; i<data.keyList.length; i++)
        {
            address addr = data.keyList[i];

            offset[i] = bytes(names).length;
            names = Utils.Concat(names,data.dataMap[addr].person.name);
            IDs[i] = data.dataMap[addr].person.ID;
        }

        return (data.keyList,names,offset,IDs);
    }

    function GetStatus(MemberList storage data, address addr) public view returns (uint,string memory,uint){
        // 0 register; 1 confirm; 2 reject; 3 false
        if(data.confirm.dataMap[addr].flag != 0)
            return (1,data.confirm.dataMap[addr].person.name,data.confirm.dataMap[addr].person.ID);
        if(data.register.dataMap[addr].flag != 0)
            return (0,data.register.dataMap[addr].person.name, data.register.dataMap[addr].person.ID);
        if(data.reject.dataMap[addr].flag != 0)
            return (2, data.reject.dataMap[addr].person.name, data.reject.dataMap[addr].person.ID);
        return (3,"",0);
    }
}