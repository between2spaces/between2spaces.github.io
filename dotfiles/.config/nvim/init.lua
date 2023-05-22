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



require('lazy').setup({
	{ 'folke/tokyonight.nvim' },
	{ 'projekt0n/github-nvim-theme',
	config = function()
		--vim.cmd.colorscheme('github_dark')
	end },
	{ 'Mofiqul/vscode.nvim', config = function()
		require('vscode').load('dark')
	end },
	{ 'nvim-lua/plenary.nvim' },
	{ 'nvim-tree/nvim-web-devicons' },
	{ 'jose-elias-alvarez/null-ls.nvim' },
	{ 'VonHeikemen/lsp-zero.nvim',
	dependencies = {
		-- LSP Support
		{ 'neovim/nvim-lspconfig' },
		{
			'williamboman/mason.nvim',
			build = function()
				pcall(vim.cmd, 'MasonUpdate')
			end,
		},
		{'williamboman/mason-lspconfig.nvim'},
		-- Autocompletion
		{'hrsh7th/nvim-cmp'},     -- Required
		{'hrsh7th/cmp-nvim-lsp'}, -- Required
		{'L3MON4D3/LuaSnip'},     -- Required
	}
},
{ 'nvim-telescope/telescope.nvim' },
{ 'nvim-telescope/telescope-file-browser.nvim' },
{ 'folke/which-key.nvim' },
{ 'nvim-treesitter/nvim-treesitter', build = ':TSUpdate' },
}, {
	checker = { enabled = true, notify = false }
})



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
	extensions = {
		file_browser = {
			-- disables netrw and use telescope-file-browser in its place
			hijack_netrw = true,
			mappings = {
				["i"] = {
					-- your custom insert mode mappings
				},
				["n"] = {
					-- your custom normal mode mappings
				},
			},
		},
	},
}

-- Load telescope-file-browser extension
require("telescope").load_extension "file_browser"




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
	f = {
		name = 'Find',
		f = { '<cmd>Telescope file_browser path=%:p:h select_buffer=true<cr>', 'Files' },
		g = { '<cmd>Telescope live_grep<cr>', 'Live grep' },
		b = { '<cmd>Telescope buffers<cr>', 'Buffers' },
		h = { '<cmd>Telescope help_tags<cr>', 'Help tags' },
	},
	h = { '<cmd>bprevious<cr>', 'Buffer previous' },
	H = { '<cmd>nohlsearch<CR>', 'Clear search highlights' },
	l = { '<cmd>bnext<cr>', 'Buffer next' },
	q = { '<cmd>bdelete<cr>', 'Buffer delete' },
}, { prefix = '<leader>' })


