/* eslint-disable */
import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react';

import register from 'higlass-register';
import BigwigDataFetcher from 'higlass-bigwig-datafetcher/es/BigwigDataFetcher';

import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Chip from '@material-ui/core/Chip';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import Typography from '@material-ui/core/Typography';

register(
  { dataFetcher: BigwigDataFetcher, config: BigwigDataFetcher.config },
  { pluginType: "dataFetcher" }
);

// Lazy load the HiGlass React component,
// using a dynamic import.
const LazyHiGlassComponent = React.lazy(async () => {
  const { HiGlassComponent } = await import('higlass');
  return { default: HiGlassComponent };
});


const REFERENCE_TILESETS = {
  hg38: {
    chromosomes: 'NyITQvZsS_mOFNlz5C2LJg',
    genes: 'P0PLbQMwTYGy-5uPIQid7A',
  },
  hg19: {
    chromosomes: 'N12wVGG9SPiTkk03yUayUw',
    genes: 'OHJakQICQD6gTD7skx4EWA',
  },
  mm9: {
    chromosomes: 'WAVhNHYxQVueq6KulwgWiQ',
    genes: 'GUm5aBiLRCyz2PsBea7Yzg',
  },
  mm10: {
    chromosomes: 'EtrWT0VtScixmsmwFSd7zg',
    genes: 'QDutvmyiSrec5nX4pA5WGQ',
  },
};

const CHRS = [
	'chr1',
	'chr2',
	'chr3',
	'chr4',
	'chr5',
	'chr6',
	'chr7',
	'chr8',
	'chr9',
	'chr10',
	'chr11',
	'chr12',
	'chr13',
	'chr14',
	'chr15',
	'chr16',
	'chr17',
	'chr18',
	'chr19',
	'chr20',
	'chr21',
	'chr22',
	'chrX',
	'chrY',
];

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};
const useStyles = makeStyles((theme) => ({
	formControl: {
		margin: theme.spacing(1),
		minWidth: 200,
		maxWidth: 300,
	},
	chips: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	chip: {
		margin: 2,
	},
}));


// From https://personal.sron.nl/~pault/#sec:qualitative
const PALETTE = [
  [68, 119, 170],
  [136, 204, 238],
  [68, 170, 153],
  [17, 119, 51],
  [153, 153, 51],
  [221, 204, 119],
  [204, 102, 119],
  [136, 34, 85],
  [170, 68, 153],
];

const technologyToBigWigUrl = {
	'Bisulfite-seq': "https://s3.amazonaws.com/gosling-lang.org/data/Astrocytes-insertions_bin100_RIPnorm.bw",
	'MNase-seq': "https://s3.amazonaws.com/gosling-lang.org/data/ExcitatoryNeurons-insertions_bin100_RIPnorm.bw",
	'DNase-seq': "https://s3.amazonaws.com/gosling-lang.org/data/InhibitoryNeurons-insertions_bin100_RIPnorm.bw",
};

const ALL_TECHNOLOGIES = Object.keys(technologyToBigWigUrl); 

const cellTypeToBigWigUrl = {
	'Astrocyte': "https://s3.amazonaws.com/gosling-lang.org/data/Astrocytes-insertions_bin100_RIPnorm.bw",
	'Excitatory Neurons': "https://s3.amazonaws.com/gosling-lang.org/data/ExcitatoryNeurons-insertions_bin100_RIPnorm.bw",
	'Inhibitory Neurons': "https://s3.amazonaws.com/gosling-lang.org/data/InhibitoryNeurons-insertions_bin100_RIPnorm.bw",
};

const ALL_CELLTYPES = Object.keys(cellTypeToBigWigUrl);

const hgOptions = {
	bounded: false,
	pixelPreciseMarginPadding: true,
	containerPaddingX: 0,
	containerPaddingY: 0,
	sizeMode: 'default',
};

const initialXDomain = [
	0,
	300000000
];

function WidgetNavigation(props) {
	const {
		assembly = 'hg38',
		higlassServer = 'https://higlass.io/api/v1',
		theme = 'light',
	} = props;

	const [selectedCellTypes, setSelectedCellTypes] = useState([]);

	function handleChange(event) {
		setSelectedCellTypes(event.target.value)
	}

	const classes = useStyles();

	const hgViewConfig = useMemo(() => {

		const profileTrackHeight = 40;

		// Set up the colors to use in the HiGlass view config based on the current theme.
		const foregroundColor = (theme === 'dark' ? '#C0C0C0' : '#000000');
		const backgroundColor = (theme === 'dark' ? '#000000' : '#f1f1f1');

		// Define the "reference tracks" for chromosome labels and gene annotations.
		const referenceTracks = [
			{
				type: 'horizontal-chromosome-labels',
				server: higlassServer,
				tilesetUid: REFERENCE_TILESETS[assembly].chromosomes,
				uid: 'chromosome-labels',
				options: {
					color: foregroundColor,
					fontSize: 12,
					fontIsLeftAligned: false,
					showMousePosition: true,
					mousePositionColor: foregroundColor,
				},
				height: 30,
			},
			{
				type: 'horizontal-gene-annotations',
				server: higlassServer,
				tilesetUid: REFERENCE_TILESETS[assembly].genes,
				uid: 'gene-annotations',
				options: {
					name: 'Gene Annotations (hg38)',
					fontSize: 10,
					labelPosition: 'hidden',
					labelLeftMargin: 0,
					labelRightMargin: 0,
					labelTopMargin: 0,
					labelBottomMargin: 0,
					minHeight: 24,
					geneAnnotationHeight: 16,
					geneLabelPosition: 'outside',
					geneStrandSpacing: 4,
					showMousePosition: true,
					mousePositionColor: foregroundColor,
					plusStrandColor: foregroundColor,
					minusStrandColor: foregroundColor,
					labelColor: 'black',
					labelBackgroundColor: backgroundColor,
					trackBorderWidth: 0,
					trackBorderColor: 'black',
				},
				height: 70,
			},
		];

		const mainTracks = ALL_TECHNOLOGIES.map((technology) => {
			// Get the uid for the HiGlass track.
      const trackUid = technology;
      // Create the HiGlass track definition for this profile.
      const track = {
        type: 'horizontal-bar',
        uid: `bar-track-${trackUid}`,
        data: {
          type: 'bbi',
          url: technologyToBigWigUrl[technology],
          chromSizesUrl: `https://s3.amazonaws.com/gosling-lang.org/data/${assembly}.chrom.sizes`,
        },
        options: {
          name: technology,
          showMousePosition: true,
          mousePositionColor: foregroundColor,
          labelColor: (theme === 'dark' ? 'white' : 'black'),
          labelBackgroundColor: (theme === 'dark' ? 'black' : 'white'),
          labelShowAssembly: false,
					barFillColor: "gray",
        },
        height: profileTrackHeight,
      };
      return track;
		});

    const profileTracks = selectedCellTypes.map((cellType) => {
      // Get the uid for the HiGlass track.
      const trackUid = cellType;
      const color = PALETTE[ALL_CELLTYPES.indexOf(cellType) % PALETTE.length];
      // Create the HiGlass track definition for this profile.
      const track = {
        type: 'horizontal-bar',
        uid: `bar-track-${trackUid}`,
        data: {
          type: 'bbi',
          url: cellTypeToBigWigUrl[cellType],
          chromSizesUrl: `https://s3.amazonaws.com/gosling-lang.org/data/${assembly}.chrom.sizes`,
        },
        options: {
          name: `scATAC-seq aggregate for ${cellType}`,
          showMousePosition: true,
          mousePositionColor: foregroundColor,
          labelColor: (theme === 'dark' ? 'white' : 'black'),
          labelBackgroundColor: (theme === 'dark' ? 'black' : 'white'),
          labelShowAssembly: false,
					barFillColor: `rgb(${color[0]},${color[1]},${color[2]})`,
        },
        height: profileTrackHeight,
      };
      return track;
    });

    const hgView = {
      tracks: {
        top: [
          ...referenceTracks,
					...mainTracks,
          ...profileTracks,
        ],
        left: [],
        center: [],
        right: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      layout: {
        w: 12,
        h: 12,
        x: 0,
        y: 0,
        static: false,
      },
    };
    return hgView;
	}, [selectedCellTypes, theme, assembly]);

	const hgFullConfig = useMemo(() => {
		return {
			editable: true,
			zoomFixed: false,
			trackSourceServers: [
				'//higlass.io/api/v1',
			],
			exportViewUrl: '//higlass.io/api/v1/viewconfs',
			views: [
				{
					uid: 'main',
					...hgViewConfig,
					initialXDomain,
					initialYDomain: initialXDomain,
					"autocompleteSource": `/api/v1/suggest/?d=${REFERENCE_TILESETS[assembly].genes}&`,
					"genomePositionSearchBox": {
						"autocompleteServer": "//higlass.io/api/v1",
						"autocompleteId": REFERENCE_TILESETS[assembly].genes,
						"chromInfoServer": "https://higlass.io/api/v1",
						"chromInfoId": assembly,
						"visible": true
					},
					"chromInfoPath": `//s3.amazonaws.com/pkerp/data/${assembly}/chromSizes.tsv`,
				},
			],
			zoomLocks: {
				locksByViewUid: {},
				locksDict: {},
			},
			locationLocks: {
				locksByViewUid: {},
				locksDict: {},
			},
			valueScaleLocks: {
				locksByViewUid: {},
				locksDict: {},
			},
		};
	}, [hgViewConfig, assembly]);

	return (
		<div>
			<Grid
				container
				direction="row"
				justifyContent="start"
			>
				<Grid item xs={6} style={{ padding: '4px'}}>
					<p>This is a demo of data from publication X which uses multiple experimental technologies to reveal Y. <br/><br/>Select cell types from the list to the right to visualize corresponding aggregate scATAC-seq tracks.</p>
				</Grid>
				<Grid item xs={6}>
					<FormControl className={classes.formControl}>
						<InputLabel id="demo-mutiple-chip-label">Cell Types</InputLabel>
						<Select
							labelId="demo-mutiple-chip-label"
							id="demo-mutiple-chip"
							multiple
							value={selectedCellTypes}
							onChange={handleChange}
							input={<Input id="select-multiple-chip" />}
							renderValue={(selected) => (
								<div className={classes.chips}>
									{selected.map((value) => (
										<Chip key={value} label={value} className={classes.chip} />
									))}
								</div>
							)}
							MenuProps={MenuProps}
						>
							{ALL_CELLTYPES.map((name) => (
								<MenuItem key={name} value={name} style={{ fontWeight: 'normal' }}>
									{name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
			</Grid>
			<Suspense fallback={<div>Loading...</div>}>
				<LazyHiGlassComponent
					zoomFixed={false}
					viewConfig={hgFullConfig}
					options={hgOptions}
				/>
			</Suspense>
		</div>
	);
}

export default WidgetNavigation;
