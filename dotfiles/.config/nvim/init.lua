vim.g.mapleader = ' '

local map = vim.api.nvim_set_keymap
map('n', '<tab>', ':bn<cr>', { noremap = true } )
map('n', '<leader>e', ':e <c-d>', { noremap = true }) -- Edit
map('n', '<leader>c', ':e $MYVIMRC<cr>', { noremap = true }) -- Configuration
map('n', '<leader>w', ':w<cr>', { noremap = true }) -- Write file
map('n', '<leader>b', ':b <c-z>', { noremap = true }) -- Buffer menu 
map('n', '<leader>n', ':bn<cr>', { noremap = true }) -- Buffer next
map('n', '<leader>p', ':bp<cr>', { noremap = true }) -- Buffer previous
map('n', '<leader>d', ':bd<cr>', { noremap = true }) -- Buffer delete
map('n', '<leader>l', ':silent! 17Lex<cr>', { noremap = true }) -- Left Explorer
map('n', '<leader>f', "mmgggqG'm", { noremap = true } )
map('n', '<leader>q', ':qa<cr>', { noremap = true } )


map('c', '<c-l>', 'wildmenumode() ? "<down>" : "<c-l>"', { noremap = true, expr = true })


vim.g.clipboard = {
	name = "wl-clipboard (wsl)",
	copy = {
		["+"] = 'wl-copy --foreground --type text/plain',
		["*"] = 'wl-copy --foreground --primary --type text/plain',
},
	paste = {
		["+"] = (function()
			return vim.fn.systemlist('wl-paste --no-newline|sed -e "s/\r$//"', {''}, 1) -- '1' keeps empty lines
		end),
		["*"] = (function() 
			return vim.fn.systemlist('wl-paste --primary --no-newline|sed -e "s/\r$//"', {''}, 1)
		end),
	},
	cache_enabled = true
}

vim.opt.clipboard="unnamedplus"

vim.g.netrw_banner = false



vim.opt.swapfile = false
vim.opt.laststatus = 0
vim.opt.cmdheight = 0
vim.opt.showmode = false
vim.opt.cursorline = true
vim.opt.cursorlineopt = 'number'
vim.opt.number = true
vim.opt.signcolumn = 'number'



local au = vim.api.nvim_create_autocmd
au( 'FileType', {
	pattern = { 'javascript' },
	command = 'setlocal formatprg=npx\\ prettier-eslint\\ --stdin\\ --stdin-filepath=x.js\\ ',
} )

local hl = vim.api.nvim_set_hl
hl( 0, 'Normal', { bg = 'None' } )
hl( 0, 'LineNr', { ctermfg = 'DarkGrey' } )
hl( 0, 'CursorLineNr', { fg = 'Grey' } )
hl( 0, 'NonText', { ctermfg = 'DarkGrey' } )
hl( 0, 'Pmenu', { ctermbg = 'DarkGrey' })
hl( 0, 'PmenuSel', { ctermbg = 'White', ctermfg = 'Black' })

