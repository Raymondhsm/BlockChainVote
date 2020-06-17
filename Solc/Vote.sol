pragma solidity >=0.4.22 <0.7.0;

import './Ownable.sol';
import './Member.sol';
import './Ballot.sol';

contract Vote is Ownable
{
    // 事件
    event Success(bool);

    // 基础信息
    struct timeValue
    {
        uint64 createTime;
        uint64 registerTime;
        uint64 voteStartTime;
        uint64 voteEndTime;
    }

    string _voteName;
    timeValue _time;
    bool _isPrivate;
    uint _voteIndex;

    constructor(address ownerAddr,string memory name,
                uint64 registerTime, uint64 voteStartTime, uint64 voteEndTime,
                bool isPrivate, uint voteIndex) Ownable(ownerAddr) public {
        require((registerTime > now) && (voteStartTime > registerTime) && (voteEndTime > voteStartTime), "TIME PARAMETER ERROR");
        _voteName = name;
        _time = timeValue(uint64(now), registerTime, voteStartTime, voteEndTime);
        _isPrivate = isPrivate;
        _voteIndex = voteIndex;
    }

    function SetVoteInfo(string calldata name, uint64 registerTime, uint64 voteStartTime, uint64 voteEndTime)
                        external onlyOwner {
        require(registerTime == _time.registerTime || (registerTime < voteStartTime && registerTime > now), "ERROR REGISTER TIME.");
        require(voteStartTime == _time.voteStartTime || (voteStartTime > registerTime && voteStartTime > now), "ERROR START TIME.");
        require(voteEndTime == _time.voteEndTime || (voteEndTime > voteStartTime || voteEndTime > now), "ERROR END TIME.");
        _voteName = name;
        _time = timeValue(_time.createTime, registerTime, voteStartTime, voteEndTime);
    }

    function GetVoteInfo() public view returns(string memory, uint, uint, uint, uint,bool,uint){
        return (_voteName, _time.createTime, _time.registerTime, _time.voteStartTime,_time.voteEndTime,_isPrivate,_voteIndex);
    }

    // 注册相关
    Member.MemberList candidate;
    Member.MemberList voter;

    // 管理员使用的注册函数
    function Register(uint flag,address addr,
                        string memory name,
                        uint ID)
                        public onlyOwner {
        require(_time.voteStartTime > now, "NOT REGISTER TIME.");
        require(flag == 0 || _isPrivate, "VOTER REGISTER IS NOT NEEDED IN PUBLIC VOTE.");
        bool success = false;
        if(flag == 0)
        {
            success = Member.Insert(candidate,addr,name,ID);
        }
        else if(flag == 1)
        {
            success = Member.Insert(voter,addr,name,ID);
        }
        emit Success(success);
    }

    // 正常注册
    function RegisterSelf(uint flag, string memory name, uint ID)
            public {
        require(_time.voteStartTime > now, "NOT REGISTER TIME.");
        require(flag == 0 || _isPrivate, "VOTER REGISTER IS NOT NEEDED IN PUBLIC VOTE.");
        bool success = false;
        if(flag == 0)
        {
            success = Member.Insert(candidate,msg.sender,name,ID);
        }
        else if(flag == 1)
        {
            success = Member.Insert(voter,msg.sender,name,ID);
        }
        emit Success(success);
    }

    // 管理员处理申请
    function StatusChange(uint flag,uint fromStatus,
                            uint toStatus,address addr)
                            public onlyOwner{
        // flag 0 for candidate, 1 for voter
        // status 0 for register, 1 for confirm, 2 for reject
        require(_time.voteStartTime > now, "NOT REGISTER TIME.");
        require(flag == 0 || _isPrivate, "VOTER STATUS CHANGE IS NOT NEEDED IN PUBLIC VOTE.");
        bool success = false;
        if(flag == 0)
        {
            if(fromStatus == 0 && toStatus == 1)
                success = Member.StatusChange(candidate.register,candidate.confirm,addr);
            else if(fromStatus == 0 && toStatus == 2)
                success = Member.StatusChange(candidate.register,candidate.reject,addr);
            else if(fromStatus == 1 && toStatus == 2)
                success = Member.StatusChange(candidate.confirm,candidate.reject,addr);
            else if(fromStatus == 2 && toStatus == 1)
                success = Member.StatusChange(candidate.reject,candidate.confirm,addr);
        }
        else if(flag == 1)
        {
            if(fromStatus == 0 && toStatus == 1)
                success = Member.StatusChange(voter.register,voter.confirm,addr);
            else if(fromStatus == 0 && toStatus == 2)
                success = Member.StatusChange(voter.register,voter.reject,addr);
            else if(fromStatus == 1 && toStatus == 2)
                success = Member.StatusChange(voter.confirm,voter.reject,addr);
            else if(fromStatus == 2 && toStatus == 1)
                success = Member.StatusChange(voter.reject,voter.confirm,addr);
        }
        emit Success(success);
    }

    // 管理员获取申请列表
    function GetPersonList(uint flag, uint status)
                public view onlyOwner
                returns (address[] memory,string memory,uint[] memory,uint[] memory){
        // flag 0 for candidate, 1 for voter
        // status 0 for register, 1 for confirm, 2 for reject
        if(flag == 0)
        {
            if(status == 0)
                return Member.GetList(candidate.register);
            else if(status == 1)
                return Member.GetList(candidate.confirm);
            else if(status == 2)
                return Member.GetList(candidate.reject);
        }
        else if(flag == 1)
        {
            if(status == 0)
                return Member.GetList(voter.register);
            else if(status == 1)
                return Member.GetList(voter.confirm);
            else if(status == 2)
                return Member.GetList(voter.reject);
        }
        return (new address[](0),"",new uint[](0),new uint[](0));
    }

    // 获取候选人名单
    function GetCandidateList() public view
        returns (address[] memory,string memory,uint[] memory,uint[] memory){
        require(_time.voteStartTime < now, "投票未开始");
        address[] memory addr;
        string memory names;
        uint[] memory offset;
        uint[] memory ids;
        (addr,names,offset,ids) = Member.GetList(candidate.confirm);
        // emit ReturnCandidateList(addr,names,offset,ids);
        return (addr, names, offset, ids);
    }

    // 获取申请状态
    function GetOwnStatus() public view returns (uint,uint){
        // 0 register; 1 confirm; 2 reject; 3 false
        uint canStatus;
        uint voterStatus;
        (canStatus,,) = Member.GetStatus(candidate,msg.sender);
        (voterStatus,,) = Member.GetStatus(voter,msg.sender);
        return (canStatus, voterStatus);
    }

    // 投票计票相关
    BallotLib.Ballot[] ballotList;
    mapping(address=>uint) ballotIndex;
    function ToVote(uint can) public returns (bool){
        require((_time.voteEndTime > now) && (_time.voteStartTime < now), "NOT VOTE TIME.");
        bool success = false;
        if(!Member.ContainKey(voter.confirm, msg.sender) && _isPrivate) success = false;

        success = BallotLib.Insert(ballotList,ballotIndex,can,msg.sender);

        emit Success(success);
    }

    function GetMyCandidate() public view returns (uint) {
        if(ballotIndex[msg.sender] == 0) return 0;

        return ballotList[ballotIndex[msg.sender]-1].candidate + 1;
    }

    function CalculateVote() public view
        returns (string memory,uint[] memory,uint[] memory){
        require(_time.voteEndTime < now, "VOTE IS NOT END.");
        // 匿名处理需要参数的修改
        string memory names;
        uint[] memory offset;
        (,names,offset,) = GetCandidateList();
        return (names,offset,BallotLib.CalculateBallot(ballotList,candidate.confirm.keyList.length));
    }
}