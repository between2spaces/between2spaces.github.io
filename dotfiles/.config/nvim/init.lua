vim.g.mapleader = ';'

local map = vim.api.nvim_set_keymap
map('n', '<leader>e', ':e <c-z>', { noremap = true }) -- Edit
map('n', '<leader>w', ':w<cr>', { noremap = true }) -- Write file
map('n', '<leader>n', ':bn<cr>', { noremap = true }) -- Buffer next
map('n', '<leader>p', ':bp<cr>', { noremap = true }) -- Buffer previous
map('n', '<leader>d', ':bd<cr>', { noremap = true }) -- Buffer delete
map('n', '<leader>l', ':silent! 20Lex<cr>', { noremap = true }) -- Left Explorer

map('i', '<leader>;', '<esc>', { noremap = true })
map('i', '<c-;>', ';', { noremap = true })
map('v', '<leader>', '<esc>:', { noremap = true })
map('c', '<leader>', '<c-c>', { noremap = true })

map('c', '<cr>', 'wildmenumode() ? "<down>" : "<cr>"', { noremap = true, expr = true })



vim.opt.swapfile = false
vim.opt.laststatus = 0
vim.opt.cmdheight = 0
vim.opt.showmode = false


local hl = vim.api.nvim_set_hl
hl(0, 'Pmenu', { ctermbg = 'DarkGrey' })
hl(0, 'PmenuSel', { ctermbg = 'DarkBlue' })
