return {
	"nvim-telescope/telescope.nvim",
	dependencies = { 'nvim-lua/plenary.nvim' },
	event = "Bufenter",
	config = function()
		local status_ok, telescope = pcall(require, "telescope")
		if not status_ok then
			return
		end
		local telescope_actions = require("telescope.actions")
		telescope.setup {
			defaults = {
				mappings = {
					i = {
						["<esc>"] = telescope_actions.close,
					},
				},
			},
			pickers = {
				find_files = {
					find_command = { 'rg', '--files', '--hidden', '--iglob', '!.vscode-server/**', '--smart-case' }
				},
				live_grep = {
					find_command = { 'rg', '--hidden', '--iglob', '!.vscode-server/**', '--smart-case' }
				}
			}
		}
	end
}
