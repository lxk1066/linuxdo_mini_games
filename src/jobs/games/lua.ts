// Lua脚本字符串
const script = `
local function removeMinAndRandomMember(key)
    -- 移除并获取 score 最小的成员
    local minMember, minScore = redis.call('ZPOPMIN', key)
    if minMember == nil then 
        return {{}, {}} -- 返回两个空表
    end

    -- 获取所有成员及其 scores
    local members = redis.call('ZRANGEBYSCORE', key, '-inf', '+inf', 'WITHSCORES')
    local count = #members / 2

    -- 如果没有其他成员了，则只返回最小的成员
    if count == 0 then
        return {minMember, {}}
    end

    -- 生成随机索引
    local randomIndex = math.random(count) - 1 -- 减1是因为数组索引是从1开始的

    -- 通过索引获取随机成员及其 score
    local randomMember = members[randomIndex * 2 + 1]
    local randomScore = members[randomIndex * 2 + 2]

    -- 移除随机选中的成员
    redis.call('ZREM', key, randomMember)

    -- 返回最小成员和随机成员
    return {minMember, {randomMember, randomScore}}
end

return removeMinAndRandomMember(KEYS[1])
`;

export default script;
