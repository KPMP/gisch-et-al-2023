/* eslint-disable */
import React, { Suspense, useRef, useState, useMemo, useCallback, useEffect } from 'react';

import register from 'higlass-register';
import { BigwigDataFetcher } from 'higlass-bigwig-datafetcher';

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
		maxWidth: 'none',
	},
	buttonContainer: {
		display: 'inline-block'
	},
	button: {
		margin: theme.spacing(1)
	},
	chips: {
		display: 'flex',
		flexWrap: 'wrap',
	},
	chip: {
		margin: 2,
		height: 'auto',
	},
	container: {
		display: 'flex',
		flexDirection: 'column',
		height: 'calc(100%)'
	},
	gridContainer: {
		flexGrow: 0,
	},
	higlassContainer: {
		flexGrow: 1,
		flexBasis: 1,
		height: 'calc(100%)'
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

// https://vitessce-protected.s3.amazonaws.com/y2023-eadon-lab/H3K27Ac.20.Rep1_Rep2_Rep3.KTRC.A_B_D.merge.norm.bw

const baseUrl = 'https://vitessce-protected.s3.amazonaws.com/y2023-eadon-lab';

const technologyToBigWigUrl = {
	'Methylation levels (WGBS): microdissected glomeruli (GLOM)': `${baseUrl}/mlGLOM.bw`,
	'Methylation levels (WGBS): microdissected tubulointerstitium (TI)': `${baseUrl}/mlTI.bw`,
	'Histone modifications (CUT&RUN): H3K27Ac (active chromatin)': `${baseUrl}/H3K27Ac.20.Rep1_Rep2_Rep3.KTRC.A_B_D.merge.norm.bw`,
	'Histone modifications (CUT&RUN): H3K4me1 (active chromatin)': `${baseUrl}/H3K4me1.20.Rep1_2_3.merge.norm.bw`,
	'Histone modifications (CUT&RUN): H3K4me3 (active chromatin)': `${baseUrl}/H3K4me3.20.Rep1_2_3.merge.norm.bw`,
	'Histone modifications (CUT&RUN): H3K27me3 (repressive chromatin)': `${baseUrl}/H3K27me3.20.Rep1_Rep2_Rep3.687_688_LN2_OCT.KTRC.A_B_D.merge.norm.bw`,
};

const technologyToColor = {
	'Methylation levels (WGBS): microdissected glomeruli (GLOM)': [0x11, 0x38, 0x91],
	'Methylation levels (WGBS): microdissected tubulointerstitium (TI)': [0xbb, 0x00, 0x1e],
	'Histone modifications (CUT&RUN): H3K27Ac (active chromatin)': [0x00, 0x69, 0x50],
	'Histone modifications (CUT&RUN): H3K4me1 (active chromatin)': [0x00, 0xa6, 0xdd],
	'Histone modifications (CUT&RUN): H3K4me3 (active chromatin)': [0x00, 0xb1, 0x2a],
	'Histone modifications (CUT&RUN): H3K27me3 (repressive chromatin)': [0x80, 0x17, 0x37],
};

const ALL_TECHNOLOGIES = Object.keys(technologyToBigWigUrl); 

// PT = proximal tubule
// TAL = thick ascending limb
// POD = podocyte
// C-TAL = cortical TAL

const cellTypeClassToBigWigUrl = {
	'aPT': `${baseUrl}/Multiome_paper/aPT.bw`,
	'aTAL12': `${baseUrl}/Multiome_paper/aTAL12.bw`,
	'C-TAL': `${baseUrl}/Multiome_paper/C-TAL.bw`,
	'POD': `${baseUrl}/Multiome_paper/POD.bw`,
	'PT-S1': `${baseUrl}/Multiome_paper/PT-S1.bw`,
	'PT-S12': `${baseUrl}/Multiome_paper/PT-S12.bw`,
	'PT-S2': `${baseUrl}/Multiome_paper/PT-S2.bw`,
	'PT-S3': `${baseUrl}/Multiome_paper/PT-S3.bw`,
};

const cellTypeSubclassToBigWigUrl = {
	'ATL (subclass)': `${baseUrl}/Multiome_subclassl1/ATL_subclass.l1.bw`,
	'CNT (subclass)': `${baseUrl}/Multiome_subclassl1/CNT_subclass.l1.bw`,
	'DCT (subclass)': `${baseUrl}/Multiome_subclassl1/DCT_subclass.l1.bw`,
	'DTL (subclass)': `${baseUrl}/Multiome_subclassl1/DTL_subclass.l1.bw`,
	'EC (subclass)': `${baseUrl}/Multiome_subclassl1/EC_subclass.l1.bw`,
	'FIB (subclass)': `${baseUrl}/Multiome_subclassl1/FIB_subclass.l1.bw`,
	'IC (subclass)': `${baseUrl}/Multiome_subclassl1/IC_subclass.l1.bw`,
	'IMM (subclass)': `${baseUrl}/Multiome_subclassl1/IMM_subclass.l1.bw`,
	'NEU (subclass)': `${baseUrl}/Multiome_subclassl1/NEU_subclass.l1.bw`,
	'PapE (subclass)': `${baseUrl}/Multiome_subclassl1/PapE_subclass.l1.bw`,
	'PC (subclass)': `${baseUrl}/Multiome_subclassl1/PC_subclass.l1.bw`,
	'PEC (subclass)': `${baseUrl}/Multiome_subclassl1/PEC_subclass.l1.bw`,
	'POD (subclass)': `${baseUrl}/Multiome_subclassl1/POD_subclass.l1.bw`,
	'PT (subclass)': `${baseUrl}/Multiome_subclassl1/PT_subclass.l1.bw`,
	'TAL (subclass)': `${baseUrl}/Multiome_subclassl1/TAL_subclass.l1.bw`,
	'VSM-P (subclass)': `${baseUrl}/Multiome_subclassl1/VSM-P_subclass.l1.bw`,
};

const cellTypeToBigWigUrl = {
	...cellTypeClassToBigWigUrl,
	...cellTypeSubclassToBigWigUrl,
};



const ALL_CELLTYPES = Object.keys(cellTypeToBigWigUrl);
const ALL_COARSE = Object.keys(cellTypeClassToBigWigUrl);
const ALL_FINE = Object.keys(cellTypeSubclassToBigWigUrl);


const hgOptions = {
	sizeMode: "bounded", // Stretch the height of HiGlass to its container <div/>
	pixelPreciseMarginPadding: false,
	bounded: true,
	containerPaddingX: 0,
	containerPaddingY: 0,
	viewMarginTop: 0,
	viewMarginBottom: 0,
	viewMarginLeft: 0,
	viewMarginRight: 0,
	viewPaddingTop: 0,
	viewPaddingBottom: 0,
	viewPaddingLeft: 0,
	viewPaddingRight: 0,
};

const initialXDomain = [
	0,
	300000000
];

// Map from a lock name (arbitrary) to a list of tracks (assumed to be in the "main" view).
const lockGroups = {
	"methylation": [
		"bar-track-Methylation levels (WGBS): microdissected glomeruli (GLOM)",
		"bar-track-Methylation levels (WGBS): microdissected tubulointerstitium (TI)"
	],
	"active-chromatin": [
		'Histone modifications (CUT&RUN): H3K27Ac (active chromatin)',
		'Histone modifications (CUT&RUN): H3K4me1 (active chromatin)',
		'Histone modifications (CUT&RUN): H3K4me3 (active chromatin)',
	],
	// only one track for repressive chromatin, so no need for lock.
	"coarse": Object.keys(ALL_COARSE),
	"fine": Object.keys(ALL_FINE),
}

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
		const backgroundColor = (theme === 'dark' ? '#000000' : '#fff');

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

			const color = technologyToColor[technology];
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
					barFillColor: `rgb(${color[0]},${color[1]},${color[2]})`,
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
		// Construct locks for value scales.
		const locksByViewUid = {};
		Object.entries(lockGroups).forEach(([lockName, trackUids]) => {
			trackUids.forEach(trackUid => {
				locksByViewUid[`main.${trackUid}`] = lockName;
			});
		});
		const locksDict = {};
		Object.entries(lockGroups).forEach(([lockName, trackUids]) => {
			locksDict[lockName] = { uid: lockName };
			trackUids.forEach(trackUid => {
				locksDict[lockName][`main.${trackUid}`] = {
					view: "main",
					track: trackUid,
				};
			});
		});

		// Return view config.
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
			// Reference: https://github.com/higlass/higlass/blob/b2ee5940c519982dc53685153ff863d64443d0bb/docs/examples/viewconfs/lots-of-locks.json#L158
			valueScaleLocks: {
				locksByViewUid,
				locksDict,
			},
		};
	}, [hgViewConfig, assembly]);

	

	function onAllCoarse() {
		setSelectedCellTypes(ALL_COARSE);
	}
	function onAllFine() {
		setSelectedCellTypes(ALL_FINE);
	}
	function onClearAll() {
		setSelectedCellTypes([]);
	}

	return (
		<div className={classes.container}>
			<div className={classes.gridContainer}>
				<Grid
					container
					direction="row"
					justifyContent="start"
				>
					<Grid item xs={6} style={{ padding: '4px'}}>
						<p>The chromatin landscape of healthy and injured cell types in the human kidney<br/><br/>Select cell types from the list to the right to visualize corresponding aggregate scATAC-seq tracks.</p>
					</Grid>
					<Grid item xs={4}>
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
					<Grid item xs={2}>
						<FormControl className={classes.buttonContainer}>
							<Button size="small" variant="outlined" className={classes.button} onClick={onAllCoarse}>All classes</Button>
							<Button size="small" variant="outlined" className={classes.button} onClick={onAllFine}>All subclasses</Button>
							<Button size="small" variant="outlined" className={classes.button} onClick={onClearAll}>Clear all</Button>
						</FormControl>
					</Grid>
				</Grid>
			</div>
			<div className={classes.higlassContainer}>
				<Suspense fallback={<div>Loading...</div>}>
					<LazyHiGlassComponent
						zoomFixed={false}
						viewConfig={hgFullConfig}
						options={hgOptions}
					/>
				</Suspense>
			</div>
		</div>
	);
}

export default WidgetNavigation;
