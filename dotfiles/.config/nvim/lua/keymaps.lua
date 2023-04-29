-- Shorten function name
local keymap = vim.keymap.set
-- Silent keymap option
local opts = { silent = true }

--Remap space as leader key
keymap("", "<Space>", "<Nop>", opts)
vim.g.mapleader = " "

-- Modes
--   normal_mode = "n",
--   insert_mode = "i",
--   visual_mode = "v",
--   visual_block_mode = "x",
--   term_mode = "t",
--   command_mode = "c",

-- Normal --
-- Better window navigation
keymap("n", "<C-h>", "<C-w>h", opts)
keymap("n", "<C-j>", "<C-w>j", opts)
keymap("n", "<C-k>", "<C-w>k", opts)
keymap("n", "<C-l>", "<C-w>l", opts)

-- Resize with Ctrl+hjkl
keymap("n", "<M-k>", ":resize -1<CR>", opts)
keymap("n", "<M-j>", ":resize +1<CR>", opts)
keymap("n", "<M-h>", ":vertical resize -1<CR>", opts)
keymap("n", "<M-l>", ":vertical resize +1<CR>", opts)

-- Navigate buffers
keymap("n", "L", ":bnext<CR>", opts)
keymap("n", "H", ":bprevious<CR>", opts)

-- Clear highlights
keymap("n", "<leader>x", "<cmd>nohlsearch<CR>", opts)

-- Close window
keymap("n", "<leader>q", "<C-w>q", opts)

-- Better paste
keymap("v", "p", '"_dP', opts)

-- Insert --
-- Press jk fast to esc
keymap("i", "jk", "<ESC>", opts)

-- Visual --
-- Stay in indent mode
keymap("v", "<", "<gv", opts)
keymap("v", ">", ">gv", opts)



-- Plugins --

-- NvimTree
keymap("n", "<leader>e", ":NvimTreeToggle<CR>", opts)


-- ToggleTerm
--keymap("n", "<C-\\>", ':ToggleTerm direction="vertical"<CR>')
--keymap("n", "<C-|>", ':ToggleTerm direction="horizontal"<CR>')
