---------------------------------------------
-- keymap
--

vim.g.mapleader = " "

vim.keymap.set("n", "<leader>e", vim.cmd.Ex)


---------------------------------------------
-- options
--

local opt = vim.opt

opt.number = true
opt.relativenumber = true
opt.signcolumn = "number"


---------------------------------------------
-- plugins
--

-- bootstrap plugin manager
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

	--------------------------------------------------------
	-- Telescope - Fizzy finder over lists
	--
	{
		"nvim-telescope/telescope.nvim",
		dependencies = "nvim-lua/plenary.nvim",
		keys = {
			{ "<leader><space>", "<cmd>Telescope find_files<cr>", desc = "Find Files" },
			{ "<leader>/", "<cmd>Telescope live_grep<cr>", desc = "Find in Files (Grep)" },
			{ "<leader><tab>", "<cmd>Telescope buffers<cr>", desc = "Find Buffers" },
			{ "<leader>h", "<cmd>Telescope help_tags<cr>", desc = "Find Help" },
		},
		opts = {
			pickers = {
				find_files = { hidden = true }
			}
		}
	},

	--------------------------------------------------------
	-- Treesitter - Parsing system for programming languages
	--
	{
		"nvim-treesitter/nvim-treesitter",
		build = ":TSUpdate",
		config = function ()
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

	--------------------------------------------------------
	-- Language services
	--
	{
		"neovim/nvim-lspconfig",
		dependencies = {
			"williamboman/mason.nvim",
			"williamboman/mason-lspconfig.nvim",
		},
		config = function ()
			local lspconfig = require("lspconfig")
			require("mason").setup()
			require("mason-lspconfig").setup {
				ensure_installed = {"lua_ls", "tsserver"}
			}
			require("mason-lspconfig").setup_handlers {
				function (server)
					lspconfig[server].setup {}
				end,
				["lua_ls"] = function ()
					lspconfig.lua_ls.setup {
						settings = {
							Lua = { diagnostics = { globals = { "vim" } } }
						}
					}
				end,
			}
		end,
	},

	--------------------------------------------------------
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
					["<Tab>"] = cmp.mapping.confirm({ select = true }), -- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.
					["<S-CR>"] = cmp.mapping.confirm({
						behavior = cmp.ConfirmBehavior.Replace,
						select = true,
					}), -- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.
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

})

