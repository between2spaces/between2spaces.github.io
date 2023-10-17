--------------------------------------------------------------------------------------
-- Leader key is <space>
--

vim.g.mapleader = " "


--------------------------------------------------------------------------------------
-- options
--

vim.opt.mouse = 'a'
vim.opt.scrolloff = 2
vim.opt.wildoptions = "tagfile"

-- hide the statusline
vim.opt.laststatus = 0
vim.opt.cmdheight = 0
vim.opt.showmode = false

-- netrw config
vim.g.netrw_liststyle = 3
vim.g.netrw_banner = false

-- copy to system clipboard
vim.api.nvim_set_option("clipboard", "unnamed")



-------------------------------------------------------------------------------
-- Override colorscheme with transparent background
--

vim.api.nvim_create_autocmd("ColorScheme", {
	pattern = "*",
	callback = function()
		vim.api.nvim_set_hl(0, "Normal", { bg = "none" })
	end,
})



--------------------------------------------------------------------------------------
-- plugins
--

local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
	vim.fn.system({
		"git",
		"clone",
		"--filter=blob:none",
		"https://github.com/folke/lazy.nvim.git",
		"--branch=stable", lazypath,
	})
end


vim.opt.rtp:prepend(vim.env.LAZY or lazypath)


require("lazy").setup({

	------------------------------------------------------------------------------
	-- Colorschemes with tree-sitter support
	-- https://github.com/rockerBOO/awesome-neovim#tree-sitter-supported-colorscheme
	--
	{ "tomasiser/vim-code-dark", config = function() vim.cmd "colorscheme codedark" end },


	------------------------------------------------------------------------------
	-- Telescope - Fizzy finder over lists
	--
	{
		"nvim-telescope/telescope.nvim",
		dependencies = "nvim-lua/plenary.nvim",
		opts = {
			pickers = {
				find_files = { hidden = true }
			}
		}
	},


	------------------------------------------------------------------------------
	-- Treesitter - Parsing system for programming languages
	--
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate",
		config = function()
			require("nvim-treesitter.configs").setup({
				ensure_installed = {
					"c", "lua", "vim", "vimdoc", "query", "bash",
					"javascript", "json"
				},
				auto_install = true,
				highlight = { enable = true },
				indent = { enable = true },
			})
		end
	},


	------------------------------------------------------------------------------
	-- Lsp
	--
	{
		"neovim/nvim-lspconfig",
		dependencies = {
			"williamboman/mason.nvim",
			"williamboman/mason-lspconfig.nvim",
		},
		config = function()
			require("mason").setup()
			require("mason-lspconfig").setup {
				ensure_installed = { "lua_ls", "tsserver", "eslint" },
				automatic_installation = true,
				handlers = {
					function(server_name) -- default handler (optional)
						require("lspconfig")[server_name].setup {}
					end,
					["lua_ls"] = function()
						require("lspconfig").lua_ls.setup = {
							Lua = { diagnostics = { globals = { "vim" } } }
						}
					end,
				}
			}
			--lspconfig.tsserver.setup {}
			--		capabilities = {
			--			documentFormattingProvider = false,
			--			documentRangeFormattingProvider = false,
			--		}
			--	}
			--end,
		end,
	},


	------------------------------------------------------------------------------
	-- Completions
	--
	{
		"hrsh7th/nvim-cmp",
		dependencies = {
			"hrsh7th/cmp-nvim-lsp",
			"hrsh7th/cmp-buffer",
			"hrsh7th/cmp-path",
			"saadparwaiz1/cmp_luasnip",
			"L3MON4D3/LuaSnip",
		},
		opts = function()
			vim.api.nvim_set_hl(0, "CmpGhostText", { link = "Comment", default = true })
			local cmp = require("cmp")
			local defaults = require("cmp.config.default")()
			return {
				completion = {
					completeopt = "menu,menuone,noinsert",
				},
				snippet = {
					expand = function(args)
						require("luasnip").lsp_expand(args.body)
					end,
				},
				mapping = cmp.mapping.preset.insert({
					["<C-n>"] = cmp.mapping.select_next_item({ behavior = cmp.SelectBehavior.Insert }),
					["<C-p>"] = cmp.mapping.select_prev_item({ behavior = cmp.SelectBehavior.Insert }),
					["<C-b>"] = cmp.mapping.scroll_docs(-4),
					["<C-f>"] = cmp.mapping.scroll_docs(4),
					["<C-Space>"] = cmp.mapping.complete(),
					["<C-e>"] = cmp.mapping.abort(),
					["<Tab>"] = cmp.mapping.confirm({ select = true }),
					["<S-CR>"] = cmp.mapping.confirm({
						behavior = cmp.ConfirmBehavior.Replace,
						select = true,
					}),
					["<C-CR>"] = function(fallback)
						cmp.abort()
						fallback()
					end,
				}),
				sources = cmp.config.sources({
					{ name = "nvim_lsp" },
					{ name = "luasnip" },
					{ name = "path" },
				}, {
					{ name = "buffer" },
				}),
				experimental = {
					ghost_text = {
						hl_group = "CmpGhostText",
					},
				},
				sorting = defaults.sorting,
			}
		end,
	},


	------------------------------------------------------------------------------
	-- Which key
	--
	{
		"folke/which-key.nvim",
		config = function()
			vim.o.timeout = true
			vim.o.timeoutlen = 300
			local wk = require "which-key"
			wk.setup {
				icons = {
					group = "",
				},
			}
			wk.register({
				f = { "<cmd>Telescope find_files<cr>", "Find File" },
				r = { "<cmd>Telescope oldfiles<cr>", "Recent Files" },
				c = { "<cmd>e $MYVIMRC<cr>", "Config" },
				n = { "<cmd>ene <bar> startinsert<cr>", "New Buffer" },
				q = { "<cmd>bdelete<cr>", "Close Buffer" },
				['<tab>'] = { "<cmd>Telescope buffers<cr>", "Find Buffer" },
				e = { "<cmd>sil 15Lex<cr>", "Toggle Explorer" },
				g = { "<cmd>Telescope live_grep<cr>", "Find in Files (Grep)" },
				h = { "<cmd>Telescope help_tags<cr>", "Help" },
				t = { "<cmd>terminal<cr>", "Terminal" },
			}, { prefix = "<leader>" })
		end
	},


})



-------------------------------------------------------------------------------
-- Format on save using EslintFixAll for Javascript/Typescript
--

vim.api.nvim_create_autocmd("BufWritePre", {
	pattern = { "*.js", "*.jsx", "*.ts", "*.tsx" },
	command = "silent! EslintFixAll"
})


