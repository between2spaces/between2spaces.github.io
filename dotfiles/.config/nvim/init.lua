vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

vim.opt.timeout = true
vim.opt.timeoutlen = 300
vim.opt.autowrite = true -- Enable auto write
vim.opt.autoread = true
vim.opt.clipboard = '' -- Disable sync with system clipboard
--vim.opt.tabstop = 4 -- Number of spaces tabs count for
--vim.opt.shiftwidth = 4 -- Number of spaces per intentation level
--vim.opt.shiftround = true
vim.opt.autoindent = false
vim.opt.smartindent = false


-- Configure use of WslClipboard
vim.cmd([[
let g:clipboard = {
	\   'name': 'WslClipboard',
	\   'copy': {
		\      '+': 'clip.exe',
		\      '*': 'clip.exe',
		\    },
		\   'paste': {
			\      '+': 'powershell.exe -c [Console]::Out.Write($(Get-Clipboard -Raw).tostring().replace('`r', ''))',
			\      '*': 'powershell.exe -c [Console]::Out.Write($(Get-Clipboard -Raw).tostring().replace('`r', ''))',
			\   },
			\   'cache_enabled': 0,
			\ }
			]])



			local lazypath = vim.fn.stdpath('data') .. '/lazy/lazy.nvim'
			if not vim.loop.fs_stat(lazypath) then
				vim.fn.system({ 'git', 'clone', '--filter=blob:none', 'https://github.com/folke/lazy.nvim.git', '--branch=stable', lazypath, })
			end
			vim.opt.rtp:prepend(lazypath)



			require('lazy').setup({
				{
					'folke/which-key.nvim',
					config = function()
						local wk = require('which-key')
						wk.setup()
						wk.register({
							b = {
								name = 'Buffer',
								d = { '<cmd>bdelete<cr>', 'Buffer delete' },
								n = { '<cmd>bnext<cr>', 'Buffer next' },
								p = { '<cmd>bprevious<cr>', 'Buffer previous' },
							},
							h = { '<cmd>bprevious<cr>', 'Buffer previous' },
							H = { '<cmd>nohlsearch<CR>', 'Clear search highlights' },
							l = { '<cmd>bnext<cr>', 'Buffer next' },
							q = { '<cmd>bdelete<cr>', 'Buffer delete' },
						}, { prefix = '<leader>' })

					end
				},
				{
					'williamboman/mason.nvim',
					config = function()
						require('mason').setup()
					end,
					build = ':MasonUpdate'
				}
			}, {
				checker = { enabled = true, notify = false }
			})

