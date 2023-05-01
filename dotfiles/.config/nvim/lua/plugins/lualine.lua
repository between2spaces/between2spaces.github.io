return {
	'nvim-lualine/lualine.nvim',
	dependencies = "nvim-tree/nvim-web-devicons",
	event = { "VimEnter", "InsertEnter", "BufReadPre", "BufAdd", "BufNew", "BufReadPost" },
	config = function ()
		local status_ok, lualine = pcall(require, "lualine")
		if not status_ok then
			return
		end

		lualine.setup {
			options = {
				globalstatus = true,
				icons_enabled = true,
				always_divide_middle = true,
				theme = "auto",
				component_separators = { left = "", right = "" },
				section_separators = { left = "", right = "" },
			},
			sections = {
				lualine_a = { "mode" },
				lualine_b = { "branch" },
				lualine_c = {  {
					"diagnostics",
					sources = { "nvim_diagnostic" },
					sections = { "error", "warn" },
					symbols = { error = " ", warn = " " },
					colored = false,
					always_visible = true,
				} },
				lualine_x = { {
					"diff",
					colored = false,
					symbols = { added = " ", modified = " ", removed = " " }, -- changes diff symbols
					cond = function()
						return vim.fn.winwidth(0) > 80
					end,
				}, function()
						return "spaces: " .. vim.api.nvim_buf_get_option(0, "shiftwidth")
					end, "encoding", {
						"filetype",
						icons_enabled = false,
				} },
				lualine_y = { {
					"location",
					padding = 0,
				} },
				lualine_z = { "os.date('%a %d %b %H:%M:%S')" },
			},
		}
	end
}
