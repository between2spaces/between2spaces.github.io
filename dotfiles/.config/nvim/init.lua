local g = vim.g
g.mapleader = ' '
g.clipboard = {
	name = "wl-clipboard (wsl)",
	copy = {
		["+"] = 'wl-copy --foreground --type text/plain',
		["*"] = 'wl-copy --foreground --primary --type text/plain',
	},
	paste = {
		["+"] = (function()
			return vim.fn.systemlist('wl-paste --no-newline|sed -e "s/\r$//"', {''}, 1)
		end),
		["*"] = (function() 
			return vim.fn.systemlist('wl-paste --primary --no-newline|sed -e "s/\r$//"', {''}, 1)
		end),
	},
	cache_enabled = true
}


local opt = vim.opt
opt.clipboard = 'unnamedplus'
opt.mouse = ''
opt.swapfile = false
opt.laststatus = 0
opt.showmode = false
opt.cursorline = true
opt.cursorlineopt = 'number'
opt.number = true
opt.relativenumber = true
opt.signcolumn = 'number'
opt.tabstop = 4
opt.shiftwidth = 4
opt.wildoptions = "pum,tagfile"
opt.wildignore = "**/node_modules/**"
opt.path = ".,,**"


local map = function (lhs, rhs)
	vim.keymap.set('n', lhs, rhs, { noremap = true } )
end

map('<tab>', ':bn<cr>')
map('<leader>c', ':e $MYVIMRC<cr>') -- Configuration
map('<leader>w', ':w<cr>') -- Write file
map('<leader><tab>', ':b <c-z>') -- Buffer menu 
map('<leader>d', ':bd<cr>') -- Buffer delete
map('<leader>p', ':silent! 17Lex<cr>') -- Left Explorer
map('<leader>f', "mmgggqG'm" ) -- Format buffer
map('<leader>q', ':ZZ<cr>' ) -- Quit
map('<leader>h', ':Telescope help_tags<cr>' ) -- Fuzzy find help
map('<leader>b', ':Telescope buffers<cr>' ) -- Fuzzy find buffers
map('<leader>e', ':Telescope find_files<cr>' ) -- Fuzzy find files



local au = vim.api.nvim_create_autocmd
au( 'FileType', {
	pattern = { 'javascript' },
	command = 'setlocal formatprg=npx\\ prettier-eslint\\ --stdin\\ --stdin-filepath=x.js\\ ',
} )

local hl = vim.api.nvim_set_hl
hl( 0, 'Normal', { bg = 'None' } )
hl( 0, 'LineNr', { ctermfg = 'DarkGray' } )
hl( 0, 'CursorLineNr', { fg = 'White' } )
hl( 0, 'NonText', { ctermfg = 'Gray' } )
hl( 0, 'Pmenu', { ctermbg = 'DarkGray', ctermfg = 'Black' } )
hl( 0, 'PmenuSel', { ctermbg = 'White', ctermfg = 'Black' } )
hl( 0, 'Comment', { ctermfg = 'DarkGrey' } )


-- Plugin management
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"

if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git", "clone", "--filter=blob:none", "https://github.com/folke/lazy.nvim.git",
		"--branch=stable", lazypath,
	})
end

vim.opt.rtp:prepend(lazypath)

require('lazy').setup({
	{'nvim-telescope/telescope.nvim', tag = '0.1.x', dependencies = {'nvim-lua/plenary.nvim'}},
	{
		'folke/which-key.nvim',
		event = 'VeryLazy',
		init = function()
			vim.o.timeout = true
			vim.o.timeoutlen = 300
		end,
		opts = {},
	},
	{'VonHeikemen/lsp-zero.nvim', branch = 'v3.x'},
	{'williamboman/mason.nvim'},
	{'williamboman/mason-lspconfig.nvim'},
	{'neovim/nvim-lspconfig'},
	{'hrsh7th/cmp-nvim-lsp'},
	{'hrsh7th/nvim-cmp'},
	{'L3MON4D3/LuaSnip'},
})

local lsp_zero = require('lsp-zero')

lsp_zero.on_attach(function(client, bufnr)
	-- see :help lsp-zero-keybindings
	-- to learn the available actions
	lsp_zero.default_keymaps({buffer = bufnr})
end)

-- see :help lsp-zero-guide:integrate-with-mason-nvim
-- to learn how to use mason.nvim with lsp-zero
require('mason').setup({})
require('mason-lspconfig').setup({
	ensure_installed = {'tsserver'},
	handlers = {
		lsp_zero.default_setup,
	}
})

