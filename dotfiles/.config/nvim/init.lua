vim.g.mapleader = ' '

local map = vim.keymap.set
map('n', '<tab>', ':bn<cr>', { noremap = true } )
map('n', '<leader>e', ':e <c-d>', { noremap = true }) -- Edit
map('n', '<leader>c', ':e $MYVIMRC<cr>', { noremap = true }) -- Configuration
map('n', '<leader>w', ':w<cr>', { noremap = true }) -- Write file
map('n', '<leader><tab>', ':b <c-z>', { noremap = true }) -- Buffer menu 
map('n', '<C-j>', '<S-j>', { noremap = true }) -- Buffer next
map({'n', 'v', 'i'}, '<S-k>', '<esc>:bn<cr>', { noremap = true }) -- Buffer next
map({'n', 'v', 'i'}, '<S-j>', '<esc>:bp<cr>', { noremap = true }) -- Buffer previous
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


vim.g.netrw_banner = false



vim.opt.clipboard = 'unnamedplus'
vim.opt.mouse = ''
vim.opt.swapfile = false
vim.opt.laststatus = 0
vim.opt.showmode = false
vim.opt.cursorline = true
vim.opt.cursorlineopt = 'number'
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.signcolumn = 'number'
vim.opt.termguicolors = true


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



-- lazy.nvim plugin manager for Neovim
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({ "git", "clone", "--filter=blob:none", "https://github.com/folke/lazy.nvim.git", "--branch=stable", lazypath, })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup({
	{
		"folke/tokyonight.nvim",
		lazy = false,
		priority = 1000,
		config = function()
			require("tokyonight").setup { style = "night" }
			vim.cmd[[colorscheme tokyonight]]
		end
	},
	{
		"NvChad/nvim-colorizer.lua",
		config = function()
			require"colorizer".setup {
				buftypes = { "*" },
			}
		end
	},
	{
		"neovim/nvim-lspconfig",
		config = function()
			require"lspconfig".tsserver.setup {}
		end
	},
	{
		"akinsho/bufferline.nvim",
		version = "*",
		dependencies = "nvim-tree/nvim-web-devicons",
		config = function()
			require"bufferline".setup{}
		end
	}
})

