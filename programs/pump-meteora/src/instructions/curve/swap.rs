use anchor_lang::{system_program, prelude::*};
use anchor_spl::{
    associated_token::{self, AssociatedToken},
    token::{self, Mint, Token},
};
use crate::{
    constants::{BONDING_CURVE, CONFIG, GLOBAL}, 
    errors::*, 
    events::SwapEvent,
    state::{bondingcurve::*,  config::*}
};

// Swap instruction

/* You need to contact the owner to check this function.*/