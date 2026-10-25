export type Question = {
  id: string; title: string; difficulty: 'Easy' | 'Medium' | 'Hard'; topic: string
  description: string; starter: Record<string, string>
}
const q = (id: string, title: string, difficulty: Question['difficulty'], topic: string, description: string, js: string, py: string): Question => ({
  id, title, difficulty, topic, description,
  starter: { javascript: `// ${title}\n${js}\n`, python: `# ${title}\n${py}\n` },
})
export const QUESTIONS: Question[] = [
  q('two-sum', 'Two Sum', 'Easy', 'Hash map', 'Given an array of integers and a target, return the indices of the two numbers that add up to the target. Exactly one solution exists.', 'function twoSum(nums, target) {\n  \n}', 'def two_sum(nums, target):\n    pass'),
  q('valid-parentheses', 'Valid Parentheses', 'Easy', 'Stack', 'Given a string of ()[]{} characters, decide whether the brackets are correctly opened and closed.', 'function isValid(s) {\n  \n}', 'def is_valid(s):\n    pass'),
  q('binary-search', 'Binary Search', 'Easy', 'Binary search', 'Given a sorted array and a target, return the index of the target or -1. Must run in O(log n).', 'function search(nums, target) {\n  \n}', 'def search(nums, target):\n    pass'),
  q('climbing-stairs', 'Climbing Stairs', 'Easy', 'Dynamic programming', 'You can climb 1 or 2 steps at a time. In how many distinct ways can you reach step n?', 'function climbStairs(n) {\n  \n}', 'def climb_stairs(n):\n    pass'),
  q('max-subarray', 'Maximum Subarray', 'Medium', 'Dynamic programming', 'Find the contiguous subarray with the largest sum and return that sum.', 'function maxSubArray(nums) {\n  \n}', 'def max_sub_array(nums):\n    pass'),
  q('group-anagrams', 'Group Anagrams', 'Medium', 'Hash map', 'Group the strings in the array so that all anagrams end up in the same group.', 'function groupAnagrams(strs) {\n  \n}', 'def group_anagrams(strs):\n    pass'),
  q('longest-substring', 'Longest Substring Without Repeating Characters', 'Medium', 'Sliding window', 'Return the length of the longest substring that has no repeated characters.', 'function lengthOfLongestSubstring(s) {\n  \n}', 'def length_of_longest_substring(s):\n    pass'),
  q('merge-intervals', 'Merge Intervals', 'Medium', 'Sorting', 'Given a list of [start, end] intervals, merge all overlapping intervals and return the result.', 'function merge(intervals) {\n  \n}', 'def merge(intervals):\n    pass'),
  q('lru-cache', 'LRU Cache', 'Hard', 'Design', 'Design a cache with get(key) and put(key, value) that evicts the least recently used item when full. Both operations must run in O(1).', 'class LRUCache {\n  constructor(capacity) {}\n  get(key) {}\n  put(key, value) {}\n}', 'class LRUCache:\n    def __init__(self, capacity):\n        pass\n    def get(self, key):\n        pass\n    def put(self, key, value):\n        pass'),
  q('trapping-rain-water', 'Trapping Rain Water', 'Hard', 'Two pointers', 'Given an array of bar heights, compute how much rain water is trapped between the bars.', 'function trap(height) {\n  \n}', 'def trap(height):\n    pass'),
]
