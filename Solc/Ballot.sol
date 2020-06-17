pragma solidity >=0.4.22 <0.7.0;

library BallotLib
{
    struct Ballot
    {
        uint candidate;
        address addr;
    }

    function Insert(Ballot[] storage ballotList,mapping(address=>uint) storage map,
                    uint candidate,
                    address addr) public returns (bool){
        // 暂时不做匿名处理
        if(map[addr] == 0)
        {
            ballotList.push(Ballot(candidate,addr));
            map[addr] = ballotList.length;
        }
        else
        {
            ballotList[map[addr]-1] = Ballot(candidate,addr);
        }
        return true;
    }

    function CalculateBallot(Ballot[] storage ballotList,
                            uint candidateNum) public view returns (uint[] memory){
        // 暂时不做匿名处理
        uint[] memory result = new uint[](candidateNum);
        for(uint i = 0; i<ballotList.length; i++)
        {
            uint can = ballotList[i].candidate;
            if(can < candidateNum && can >= 0)
            {
                result[can]++;
            }
        }
        return result;
    }
}