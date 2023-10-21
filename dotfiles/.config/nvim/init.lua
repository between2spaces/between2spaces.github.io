-- map 
vim.api.nvim_set_keymap('i', ';;', '<esc>', { noremap = true })
vim.api.nvim_set_keymap('n', ';', ':', { noremap = true })
vim.api.nvim_set_keymap('v', ';', '<esc>:', { noremap = true })
vim.api.nvim_set_keymap('c', ';', '<c-c>', { noremap = true })

-- hide the statusline
vim.opt.laststatus = 0
vim.opt.cmdheight = 0
vim.opt.showmode = false


