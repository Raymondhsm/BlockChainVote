pragma solidity >=0.4.22 <0.7.0;

import './Vote.sol';
import {Utils} from './Utils.sol';

contract VoteFactory
{
    event CreateVoteSuccess(uint, Vote);

    struct VoteInfo
    {
        string name;
        Vote vote;
    }

    VoteInfo[] public voteList;
    mapping(string => uint[]) nameMap;
    mapping(address => uint[]) addressMap;

    function CreateVote(string memory name, uint64 registerTime, uint64 voteStartTime, uint64 voteEndTime, bool isPrivate) public{
        require((registerTime > now) && (voteStartTime > registerTime) && (voteEndTime > voteStartTime), "TIME PARAMETER ERROR");

        Vote vote = new Vote(msg.sender,name,registerTime, voteStartTime, voteEndTime, isPrivate,voteList.length);
        voteList.push(VoteInfo(name, vote));
        nameMap[name].push(voteList.length-1);
        addressMap[msg.sender].push(voteList.length-1);

        emit CreateVoteSuccess(voteList.length-1, vote);
    }

    function UpdateKey(string memory originKey, string memory newKey) public {
        for(uint i = 0; i<nameMap[originKey].length; i++)
        {
            voteList[nameMap[originKey][i]].name = newKey;
        }
        nameMap[newKey] = nameMap[originKey];
        delete nameMap[originKey];
    }

    function GetVoteAddressByIndex(uint index) public view returns (string memory, Vote){
        require(index >= 0 && index < voteList.length, "ERROR INDEX.");

        return (voteList[index].name, voteList[index].vote);
    }

    function GetVoteAddressByName(string memory name) public view returns (Vote[] memory){
        uint[] memory data = nameMap[name];
        Vote[] memory vote = new Vote[](data.length);

        for(uint i = 0; i<data.length; i++)
        {
            vote[i] = voteList[data[i]].vote;
        }
        return vote;
    }

    function GetOwnVote(address addr)
            public view returns (string memory, uint[] memory, Vote[] memory){
        uint[] memory data = addressMap[addr];
        string memory nameStr = "";
        uint[] memory offset = new uint[](data.length);
        Vote[] memory vote = new Vote[](data.length);

        for(uint i = 0; i<data.length; i++)
        {
            offset[i] = bytes(nameStr).length;
            nameStr = Utils.Concat(nameStr, voteList[data[i]].name);
            vote[i] = voteList[data[i]].vote;
        }
        return (nameStr, offset, vote);
    }
}