-- disbale netrw at the very start of init.lua
--vim.g.loaded_netrw = 1
--vim.g.loaded_netrwPlugin = 1


vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

vim.opt.timeout = true
vim.opt.timeoutlen = 300
vim.opt.autowrite = true -- Enable auto write
vim.opt.autoread = true
vim.opt.clipboard = '' -- Disable sync with system clipboard
vim.opt.tabstop = 4 -- Number of spaces tabs count for
vim.opt.shiftwidth = 0 -- Match tabstop
vim.opt.relativenumber = true -- Enable relative line numbers
vim.opt.signcolumn = "yes" -- Always display sign column


vim.opt.termguicolors = true



-- Configure use of WslClipboard
vim.g.clipboard = {
	name = 'WslClipboard',
	copy = {
		['+'] = 'clip.exe',
		['*'] = 'clip.exe',
	},
	paste = {
		['+'] = 'powershell.exe -c [Console]::Out.Write($(Get-Clipboard -Raw).tostring().replace("`r", ""))',
		['*'] = 'powershell.exe -c [Console]::Out.Write($(Get-Clipboard -Raw).tostring().replace("`r", ""))',
	},
	cache_enabled = false,
}


vim.cmd.colorscheme('habamax')



local lazypath = vim.fn.stdpath('data') .. '/lazy/lazy.nvim'
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({ 'git', 'clone', '--filter=blob:none', 'https://github.com/folke/lazy.nvim.git', '--branch=stable', lazypath, })
end
vim.opt.rtp:prepend(lazypath)



require( 'lazy' ).setup( {

	{ 'folke/tokyonight.nvim' },
	{ 'projekt0n/github-nvim-theme' },
	{ 'Mofiqul/vscode.nvim' },
	{ 'nvim-lua/plenary.nvim' },
	{ 'nvim-tree/nvim-web-devicons' },
	{ 'jose-elias-alvarez/null-ls.nvim' },
	{ 'neovim/nvim-lspconfig' },
	{ 'williamboman/mason.nvim', build = function() pcall(vim.cmd, 'MasonUpdate') end },
	{ 'VonHeikemen/lsp-zero.nvim' },
	{ 'williamboman/mason-lspconfig.nvim' },
	{ 'hrsh7th/nvim-cmp' },
	{ 'hrsh7th/cmp-nvim-lsp' },
	{ 'L3MON4D3/LuaSnip' },
	{ 'nvim-telescope/telescope.nvim' },
	{ 'nvim-telescope/telescope-file-browser.nvim' },
	{ 'folke/which-key.nvim' },
	{ 'nvim-treesitter/nvim-treesitter', build = ':TSUpdate' },
	{ 'nvim-tree/nvim-tree.lua' },
	--{ 'famiu/bufdelete.nvim' },
	--{ 'adelarsq/neoline.vim' },
	{ 'akinsho/bufferline.nvim' },
	{ 'nvim-lualine/lualine.nvim' },

}, {

	checker = { enabled = true, notify = false }

} )



-- LSP
local lsp = require('lsp-zero').preset({})

lsp.on_attach(function(client, bufnr)
	lsp.default_keymaps({buffer = bufnr})
end)

require('lspconfig').lua_ls.setup(lsp.nvim_lua_ls())

lsp.setup()


-- Null-ls 
local augroup = vim.api.nvim_create_augroup('LspFormatting', {})
local null_ls = require('null-ls')
null_ls.setup({
	sources = {
		null_ls.builtins.diagnostics.eslint,		-- Linter for JavaScript
		null_ls.builtins.formatting.eslint,  		-- Formatter for JavaScript
	},
	-- Format on Save
	on_attach = function(client, bufnr)
		if client.supports_method('textDocument/formatting') then
			vim.api.nvim_clear_autocmds({group=augroup, buffer=bufnr})
			vim.api.nvim_create_autocmd("BufWritePre", {
				group = augroup,
				buffer = bufnr,
				callback = function()
					vim.lsp.buf.format({
						filter = function(client)
							return client.name == "null-ls"
						end,
						bufnr=bufnr
					})
				end,
			})
		end
	end,
})



-- Telescope
require("telescope").setup {
	defaults = {
		file_ignore_patterns = {
			"node_modules", ".git/"
		},
		layout_config = {
			prompt_position = "top",
		},
		sorting_strategy = "ascending",
	},
	pickers = {
		live_grep = {
			additional_args = function(opts)
				return {"--hidden"}
			end
		},
	},
	extensions = {
		file_browser = {
			hidden = true,
			hijack_netrw = true,
		},
	},
}



-- File browser extension
require("telescope").load_extension "file_browser"


-- NvimTree
--require( 'nvim-tree' ).setup({
--	view = {
--		side = 'right',
--		width = 30,
--	},
--	filters = {
--		dotfiles = false,
--	},
--})

-- Open NvimTree at Start but do not focus
--vim.api.nvim_create_autocmd( { "VimEnter" }, {
--	callback = function()
--		require( 'nvim-tree.api' ).tree.toggle( false, true )
--	end
--} )

-- Quit Vim if NvimTree is last buffer
vim.opt.confirm = true
--vim.api.nvim_create_autocmd("BufEnter", {
--	group = vim.api.nvim_create_augroup("NvimTreeClose", {clear = true}),
--	callback = function()
--		local layout = vim.api.nvim_call_function("winlayout", {})
--		if layout[1] == "leaf" and vim.api.nvim_buf_get_option(vim.api.nvim_win_get_buf(layout[2]), "filetype") == "NvimTree" and layout[3] == nil then vim.cmd("quit") end
--	end
--})



-- Custom binding for easier Window and Buffer navigation
local opts = { noremap = true, silent = true }
vim.api.nvim_set_keymap( 'n', '<C-h>', '<C-w>h', opts )
vim.api.nvim_set_keymap( 'n', '<C-l>', '<C-w>l', opts )
vim.api.nvim_set_keymap( 'n', '<Tab>', ':Telescope buffers<cr>', opts )
vim.api.nvim_set_keymap( 'n', '<S-l>', ':bnext<cr>', opts )
vim.api.nvim_set_keymap( 'n', '<S-h>', ':bprevious<cr>', opts )


-- Custom key mappings using Which-key
local wk = require('which-key')
wk.setup()
wk.register({
	b = {
		name = 'Buffer',
		d = { '<cmd>bdelete<cr>', 'Buffer delete' },
		n = { '<cmd>bnext<cr>', 'Buffer next' },
		p = { '<cmd>bprevious<cr>', 'Buffer previous' },
	},
	e = { '<cmd>NvimTreeToggle<cr>', 'Toggle file explorer' },
	f = {
		name = 'Find',
		f = { '<cmd>Telescope find_files hidden=true<cr>', 'Find files' },
		g = { '<cmd>Telescope live_grep hidden=true<cr>', 'Live grep' },
		b = { '<cmd>Telescope file_browser path=%:p:h select_buffer=true<cr>', 'File browser' },
		h = { '<cmd>Telescope help_tags<cr>', 'Help tags' },
	},
	h = { '<cmd>bprevious<cr>', 'Buffer previous' },
	H = { '<cmd>nohlsearch<CR>', 'Clear search highlights' },
	l = { '<cmd>bnext<cr>', 'Buffer next' },
	q = { '<cmd>bdelete<cr>', 'Buffer delete' },
}, { prefix = '<leader>' })



-- Bufferline
require("bufferline").setup{}



-- Lualine
require('lualine').setup()



-- Colorscheme
--require('vscode').load('dark')
vim.cmd('colorscheme github_dark')

